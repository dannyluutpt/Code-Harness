import { LayerNode } from "@kiwii/core/effect/layer-node"
import { AppNodeBuilder } from "@kiwii/core/effect/app-node-builder"
import { httpClient } from "@kiwii/core/effect/app-node-platform"
import { Effect, Layer, Schema, Context, Stream } from "effect"
import { serviceUse } from "@kiwii/core/effect/service-use"
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http"
import { withTransientReadRetry } from "@/util/effect-http-client"
import { ChildProcess } from "effect/unstable/process"
import { AppProcess } from "@kiwii/core/process"
import path from "path"
import { makeRuntime } from "@kiwii/core/effect/runtime"
import semver from "semver"
import { InstallationChannel, InstallationVersion } from "@kiwii/core/installation/version"
import { InstallationEvent } from "@kiwii/schema/installation-event"

export type Method = "curl" | "unknown"

export type ReleaseType = "patch" | "minor" | "major"

export const Event = InstallationEvent

export function getReleaseType(current: string, latest: string): ReleaseType {
  const currMajor = semver.major(current)
  const currMinor = semver.minor(current)
  const newMajor = semver.major(latest)
  const newMinor = semver.minor(latest)

  if (newMajor > currMajor) return "major"
  if (newMinor > currMinor) return "minor"
  return "patch"
}

export const Info = Schema.Struct({
  version: Schema.String,
  latest: Schema.String,
}).annotate({ identifier: "InstallationInfo" })
export type Info = Schema.Schema.Type<typeof Info>

export function userAgent(client = "cli") {
  return `kiwii/${InstallationChannel}/${InstallationVersion}/${client}`
}

export const USER_AGENT = userAgent()

export function isPreview() {
  return InstallationChannel !== "latest"
}

export function isLocal() {
  return InstallationChannel === "local"
}

export class UpgradeFailedError extends Schema.TaggedErrorClass<UpgradeFailedError>()("UpgradeFailedError", {
  stderr: Schema.String,
}) {
  override get message() {
    return this.stderr
  }
}

// Response schema for the GitHub releases API, the only place a Kiwii version is published
const GitHubRelease = Schema.Struct({ tag_name: Schema.String })

export interface Interface {
  readonly info: () => Effect.Effect<Info>
  readonly method: () => Effect.Effect<Method>
  readonly latest: () => Effect.Effect<string>
  readonly upgrade: (method: Method, target: string) => Effect.Effect<void, UpgradeFailedError>
}

export class Service extends Context.Service<Service, Interface>()("@kiwii/Installation") {}

export const use = serviceUse(Service)

const layer: Layer.Layer<Service, never, HttpClient.HttpClient | AppProcess.Service> = Layer.effect(
  Service,
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const httpOk = HttpClient.filterStatusOk(withTransientReadRetry(http))
    const appProcess = yield* AppProcess.Service

    const text = Effect.fnUntraced(
      function* (cmd: string[], opts?: { cwd?: string; env?: Record<string, string> }) {
        const result = yield* appProcess.run(
          ChildProcess.make(cmd[0], cmd.slice(1), {
            cwd: opts?.cwd,
            env: opts?.env,
            extendEnv: true,
          }),
        )
        return result.stdout.toString("utf8")
      },
      Effect.catch(() => Effect.succeed("")),
    )

    const upgradeFailure = (method: Method, result?: { code: number; stdout: string; stderr: string }) => {
      if (result) return `Upgrade failed for ${method} (exit code ${result.code}).`
      return `Upgrade failed for ${method}.`
    }

    // Windows upgrades run install.ps1 through PowerShell. Piping the bash installer into a bash that
    // happens to be on PATH lands the install inside WSL or Git Bash and leaves the kiwii.exe that is
    // actually on PATH untouched, which reads as a successful upgrade that changed nothing.
    const upgradeScriptShell = Effect.fnUntraced(function* () {
      if (process.platform === "win32") {
        const pwsh = yield* text(["pwsh", "-NoProfile", "-NonInteractive", "-Command", "$PSVersionTable.PSVersion"])
        return {
          file: pwsh ? "pwsh" : "powershell.exe",
          args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", "-"],
          script: "install.ps1",
        }
      }
      const bashVersion = yield* text(["bash", "--version"])
      return { file: bashVersion ? "bash" : "sh", args: [] as string[], script: "install" }
    })

    const upgradeCurl = Effect.fnUntraced(
      function* (target: string) {
        const shell = yield* upgradeScriptShell()
        const response = yield* httpOk.execute(
          HttpClientRequest.get(`https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/${shell.script}`),
        )
        const body = yield* response.text
        const bodyBytes = new TextEncoder().encode(body)
        const result = yield* appProcess.run(
          ChildProcess.make(shell.file, shell.args, {
            stdin: Stream.make(bodyBytes),
            env: { VERSION: target },
            extendEnv: true,
          }),
        )
        return {
          code: result.exitCode,
          stdout: result.stdout.toString("utf8"),
          stderr: result.stderr.toString("utf8"),
        }
      },
      Effect.mapError(() => new UpgradeFailedError({ stderr: upgradeFailure("curl") })),
    )

    const result: Interface = {
      info: Effect.fn("Installation.info")(function* () {
        return {
          version: InstallationVersion,
          latest: yield* result.latest(),
        }
      }),
      // Kiwii ships through the install scripts and GitHub releases only, so the binary living in the
      // directory an installer writes to is what makes an upgrade re-runnable. Anywhere else it was
      // moved or vendored by hand and there is no script that can safely replace it.
      method: Effect.fn("Installation.method")(function* () {
        if (process.execPath.includes(path.join(".kiwii", "bin"))) return "curl" as Method
        if (process.execPath.includes(path.join(".local", "bin"))) return "curl" as Method
        return "unknown" as Method
      }),
      latest: Effect.fn("Installation.latest")(function* () {
        const response = yield* httpOk.execute(
          HttpClientRequest.get("https://api.github.com/repos/dannyluutpt/Code-Harness/releases/latest").pipe(
            HttpClientRequest.acceptJson,
          ),
        )
        const data = yield* HttpClientResponse.schemaBodyJson(GitHubRelease)(response)
        return data.tag_name.replace(/^v/, "")
      }, Effect.orDie),
      upgrade: Effect.fn("Installation.upgrade")(function* (m: Method, target: string) {
        if (m !== "curl") {
          return yield* new UpgradeFailedError({
            stderr: `kiwii at ${process.execPath} was not installed by the kiwii installer, so it cannot upgrade itself. Reinstall with "curl -fsSL https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install | bash" (PowerShell: "irm https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install.ps1 | iex").`,
          })
        }
        const upgradeResult = yield* upgradeCurl(target)
        if (upgradeResult.code !== 0) {
          return yield* new UpgradeFailedError({ stderr: upgradeFailure(m, upgradeResult) })
        }
        yield* Effect.logInfo("upgraded", {
          method: m,
          target,
          stdout: upgradeResult.stdout,
          stderr: upgradeResult.stderr,
        })
        yield* text([process.execPath, "--version"])
      }),
    }

    return Service.of(result)
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [httpClient, AppProcess.node] })

const { runPromise } = makeRuntime(Service, AppNodeBuilder.build(node))

export const latest = (...args: Parameters<Interface["latest"]>) => runPromise((s) => s.latest(...args))
export const method = () => runPromise((s) => s.method())
export const upgrade = (...args: Parameters<Interface["upgrade"]>) => runPromise((s) => s.upgrade(...args))

export * as Installation from "."
