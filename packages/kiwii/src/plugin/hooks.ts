import type { Hooks, Plugin, PluginInput } from "@kiwii/plugin"
import type { ConfigHooksV1 } from "@kiwii/core/v1/config/hooks"
import { Wildcard } from "@kiwii/core/util/wildcard"

const DEFAULT_TIMEOUT_SECONDS = 60

/** Everything a hook command receives on stdin. */
export type HookPayload = {
  hook_event_name: ConfigHooksV1.Event
  session_id?: string
  cwd: string
  tool_name?: string
  tool_input?: unknown
  tool_response?: unknown
  prompt?: string
  permission?: string
  patterns?: string[]
  event?: unknown
}

/** JSON a hook command may print on stdout. */
export type HookResult = {
  decision?: "approve" | "allow" | "block" | "deny"
  reason?: string
  additionalContext?: string
  updatedInput?: Record<string, unknown>
}

export type HookOutcome = { blocked: false; result?: HookResult } | { blocked: true; reason: string }

export class HookBlockedError extends Error {
  constructor(
    readonly event: ConfigHooksV1.Event,
    readonly reason: string,
  ) {
    super(`${event} hook blocked this action: ${reason}`)
    this.name = "HookBlockedError"
  }
}

type Runner = (
  command: ConfigHooksV1.Command,
  payload: HookPayload,
) => Promise<{ code: number; stdout: string; stderr: string }>

export function runCommand(cwd: string, env: Record<string, string>): Runner {
  return async (command, payload) => {
    const timeout = (command.timeout ?? DEFAULT_TIMEOUT_SECONDS) * 1000
    const shell = process.platform === "win32" ? ["cmd", "/c", command.command] : ["sh", "-c", command.command]
    const proc = Bun.spawn(shell, {
      cwd,
      env: { ...process.env, ...env, KIWII_PROJECT_DIR: cwd },
      stdin: new TextEncoder().encode(JSON.stringify(payload)),
      stdout: "pipe",
      stderr: "pipe",
    })
    const timer = setTimeout(() => proc.kill(), timeout)
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]).finally(() => clearTimeout(timer))
    return { code, stdout, stderr }
  }
}

function parseResult(stdout: string): HookResult | undefined {
  const trimmed = stdout.trim()
  if (!trimmed.startsWith("{")) return
  try {
    return JSON.parse(trimmed) as HookResult
  } catch {
    return
  }
}

function matches(matcher: string | undefined, toolName: string | undefined) {
  if (!matcher || matcher === "*") return true
  if (toolName === undefined) return true
  return matcher
    .split("|")
    .map((item) => item.trim())
    .some((item) => item === toolName || Wildcard.match(toolName, item))
}

/** Run every matching hook for an event. The first block wins; JSON results are merged. */
export async function runHooks(
  config: ConfigHooksV1.Info | undefined,
  event: ConfigHooksV1.Event,
  payload: Omit<HookPayload, "hook_event_name">,
  run: Runner,
): Promise<HookOutcome> {
  const entries = config?.[event] ?? []
  const merged: HookResult = {}
  for (const entry of entries) {
    if (!matches(entry.matcher, payload.tool_name)) continue
    for (const command of entry.hooks) {
      if (command.type !== "command") continue
      // A hook that cannot start is ignored so a broken hook never wedges the session.
      const result = await run(command, { ...payload, hook_event_name: event }).catch(() => ({
        code: 0,
        stdout: "",
        stderr: "",
      }))
      if (result.code === 2) {
        return { blocked: true, reason: result.stderr.trim() || result.stdout.trim() || "blocked by hook" }
      }
      // Non-zero exit codes other than 2 are treated as non-blocking (mirrors Claude Code).
      if (result.code !== 0) continue
      const parsed = parseResult(result.stdout)
      if (!parsed) continue
      if (parsed.decision === "block" || parsed.decision === "deny") {
        return { blocked: true, reason: parsed.reason ?? "blocked by hook" }
      }
      if (parsed.decision) merged.decision = parsed.decision
      if (parsed.reason) merged.reason = parsed.reason
      if (parsed.additionalContext) {
        merged.additionalContext = [merged.additionalContext, parsed.additionalContext].filter(Boolean).join("\n")
      }
      if (parsed.updatedInput) merged.updatedInput = { ...(merged.updatedInput ?? {}), ...parsed.updatedInput }
    }
  }
  return { blocked: false, result: Object.keys(merged).length ? merged : undefined }
}

function textOf(parts: { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
}

/**
 * Built-in plugin that executes the `hooks` section of kiwii.json (Claude Code compatible).
 * Commands get a JSON payload on stdin; exit code 2 blocks the action and returns stderr to the model.
 */
export const HooksPlugin: Plugin = (input) => createHooksPlugin(input)

export async function createHooksPlugin(
  input: PluginInput,
  run: Runner = runCommand(input.directory, {}),
): Promise<Hooks> {
  let hooks: ConfigHooksV1.Info | undefined
  const configured = (event: ConfigHooksV1.Event) => (hooks?.[event]?.length ?? 0) > 0
  const started = new Set<string>()

  return {
    async config(config) {
      hooks = (config as { hooks?: ConfigHooksV1.Info }).hooks
    },

    async "tool.execute.before"(ctx, output) {
      if (!configured("PreToolUse")) return
      const outcome = await runHooks(
        hooks,
        "PreToolUse",
        { session_id: ctx.sessionID, cwd: input.directory, tool_name: ctx.tool, tool_input: output.args },
        run,
      )
      if (outcome.blocked) throw new HookBlockedError("PreToolUse", outcome.reason)
      if (outcome.result?.updatedInput) Object.assign(output.args, outcome.result.updatedInput)
    },

    async "tool.execute.after"(ctx, output) {
      if (!configured("PostToolUse")) return
      const outcome = await runHooks(
        hooks,
        "PostToolUse",
        {
          session_id: ctx.sessionID,
          cwd: input.directory,
          tool_name: ctx.tool,
          tool_input: ctx.args,
          tool_response: output.output,
        },
        run,
      )
      if (outcome.blocked) {
        output.output = `${output.output}\n\n<hook_feedback>${outcome.reason}</hook_feedback>`
        return
      }
      if (outcome.result?.additionalContext) {
        output.output = `${output.output}\n\n<hook_context>${outcome.result.additionalContext}</hook_context>`
      }
    },

    async "chat.message"(ctx, output) {
      if (!configured("UserPromptSubmit")) return
      const outcome = await runHooks(
        hooks,
        "UserPromptSubmit",
        { session_id: ctx.sessionID, cwd: input.directory, prompt: textOf(output.parts) },
        run,
      )
      if (outcome.blocked) throw new HookBlockedError("UserPromptSubmit", outcome.reason)
      const extra = outcome.result?.additionalContext
      if (!extra) return
      const last = output.parts.findLast((part) => part.type === "text")
      if (last && last.type === "text") last.text = `${last.text}\n\n${extra}`
    },

    async "experimental.session.compacting"(ctx, output) {
      if (!configured("PreCompact")) return
      const outcome = await runHooks(hooks, "PreCompact", { session_id: ctx.sessionID, cwd: input.directory }, run)
      if (!outcome.blocked && outcome.result?.additionalContext) output.context.push(outcome.result.additionalContext)
    },

    async event({ event }) {
      if (!hooks) return
      const props = (event as { properties?: Record<string, unknown> }).properties ?? {}
      const sessionID = typeof props["sessionID"] === "string" ? props["sessionID"] : undefined
      const base = { session_id: sessionID, cwd: input.directory, event: event }

      switch (event.type as string) {
        case "session.created": {
          const id = (props["info"] as { id?: string } | undefined)?.id
          if (!id || started.has(id)) return
          started.add(id)
          if (configured("SessionStart")) await runHooks(hooks, "SessionStart", { ...base, session_id: id }, run)
          return
        }
        case "session.deleted": {
          const id = (props["info"] as { id?: string } | undefined)?.id
          if (configured("SessionEnd")) await runHooks(hooks, "SessionEnd", { ...base, session_id: id }, run)
          return
        }
        case "session.idle": {
          if (configured("Stop")) await runHooks(hooks, "Stop", base, run)
          return
        }
        case "permission.asked":
        case "permission.updated": {
          if (configured("Notification")) await runHooks(hooks, "Notification", base, run)
          if (!configured("PermissionRequest")) return
          const request = props as { id?: string; sessionID?: string; permission?: string; patterns?: string[] }
          if (!request.id || !request.sessionID) return
          const respond = (response: "once" | "reject") =>
            input.client
              .postSessionIdPermissionsPermissionId({
                path: { id: request.sessionID!, permissionID: request.id! },
                body: { response },
              })
              .catch(() => {})
          const outcome = await runHooks(
            hooks,
            "PermissionRequest",
            { ...base, permission: request.permission, patterns: request.patterns, tool_name: request.permission },
            run,
          )
          const decision = outcome.blocked ? "deny" : outcome.result?.decision
          if (decision === "deny" || decision === "block") await respond("reject")
          else if (decision === "allow" || decision === "approve") await respond("once")
          return
          return
        }
        default:
          return
      }
    },
  }
}
