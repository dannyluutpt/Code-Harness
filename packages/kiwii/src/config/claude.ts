export * as ConfigClaude from "./claude"

import path from "path"
import { ConfigHooksV1 } from "@kiwii/core/v1/config/hooks"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"

/** Subset of Claude Code's settings.json that Kiwii understands. */
export type Settings = {
  permissions?: { allow?: string[]; ask?: string[]; deny?: string[] }
  hooks?: Record<string, unknown>
  env?: Record<string, string>
}

export type Imported = {
  permissions?: ConfigPermissionV1.ClaudeRules
  hooks?: ConfigHooksV1.Info
  env: Record<string, string>
}

/** settings.json candidates in Claude Code's layout: global, then project (settings.json before settings.local.json). */
export function candidates(home: string, projectDirs: ReadonlyArray<string>) {
  return [
    path.join(home, ".claude", "settings.json"),
    ...projectDirs.flatMap((dir) => [path.join(dir, "settings.json"), path.join(dir, "settings.local.json")]),
  ]
}

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined

/** Parse a Claude Code settings document; unknown keys are ignored, malformed JSON yields undefined. */
export function parse(text: string): Settings | undefined {
  const value: unknown = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  })()
  if (!value || typeof value !== "object" || Array.isArray(value)) return
  const record = value as Record<string, unknown>
  const permissions =
    record["permissions"] && typeof record["permissions"] === "object"
      ? (record["permissions"] as Record<string, unknown>)
      : undefined
  const env =
    record["env"] && typeof record["env"] === "object"
      ? Object.fromEntries(
          Object.entries(record["env"] as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : undefined
  return {
    permissions: permissions && {
      allow: strings(permissions["allow"]),
      ask: strings(permissions["ask"]),
      deny: strings(permissions["deny"]),
    },
    hooks:
      record["hooks"] && typeof record["hooks"] === "object" ? (record["hooks"] as Record<string, unknown>) : undefined,
    env,
  }
}

/** Keep only hook events and command hooks Kiwii supports. */
export function hooks(input: Record<string, unknown> | undefined): ConfigHooksV1.Info | undefined {
  if (!input) return
  const result: Record<string, ConfigHooksV1.Matcher[]> = {}
  for (const event of ConfigHooksV1.EVENTS) {
    const entries = input[event]
    if (!Array.isArray(entries)) continue
    const matchers = entries.flatMap((entry): ConfigHooksV1.Matcher[] => {
      if (!entry || typeof entry !== "object") return []
      const item = entry as Record<string, unknown>
      const commands = Array.isArray(item["hooks"])
        ? item["hooks"].flatMap((hook): ConfigHooksV1.Command[] => {
            if (!hook || typeof hook !== "object") return []
            const value = hook as Record<string, unknown>
            if (value["type"] !== "command" || typeof value["command"] !== "string") return []
            return [
              {
                type: "command",
                command: value["command"],
                ...(typeof value["timeout"] === "number" ? { timeout: value["timeout"] } : {}),
              },
            ]
          })
        : []
      if (commands.length === 0) return []
      return [{ ...(typeof item["matcher"] === "string" ? { matcher: item["matcher"] } : {}), hooks: commands }]
    })
    if (matchers.length) result[event] = matchers
  }
  return Object.keys(result).length ? (result as ConfigHooksV1.Info) : undefined
}

export function toConfig(settings: Settings): Imported {
  const permissions = settings.permissions
  const rules: ConfigPermissionV1.ClaudeRules | undefined =
    permissions && (permissions.allow?.length || permissions.ask?.length || permissions.deny?.length)
      ? {
          ...(permissions.allow?.length ? { allow: [...permissions.allow] } : {}),
          ...(permissions.ask?.length ? { ask: [...permissions.ask] } : {}),
          ...(permissions.deny?.length ? { deny: [...permissions.deny] } : {}),
        }
      : undefined
  return { permissions: rules, hooks: hooks(settings.hooks), env: settings.env ?? {} }
}

/** Read and convert a settings file; missing or invalid files yield undefined. */
export async function load(file: string): Promise<Imported | undefined> {
  const text = await Bun.file(file)
    .text()
    .catch(() => undefined)
  if (text === undefined) return
  const parsed = parse(text)
  if (!parsed) return
  return toConfig(parsed)
}
