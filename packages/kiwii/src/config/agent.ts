export * as ConfigAgent from "./agent"

import path from "path"
import { Exit, Schema } from "effect"
import { Glob } from "@kiwii/core/util/glob"
import { ConfigAgentV1 } from "@kiwii/core/v1/config/agent"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"
import { configEntryNameFromPath } from "./entry-name"
import * as ConfigMarkdown from "./markdown"
import { ConfigParse } from "./parse"

export async function load(dir: string) {
  const result: Record<string, ConfigAgentV1.Info> = {}
  for (const item of await Glob.scan("{agent,agents}/**/*.md", {
    cwd: dir,
    absolute: true,
    dot: true,
    symlink: true,
  })) {
    const md = await ConfigMarkdown.parse(item).catch(() => undefined)
    if (!md) continue

    const name = configEntryNameFromPath(path.relative(dir, item), ["agent/", "agents/"])

    const config = {
      name,
      ...md.data,
      prompt: md.content.trim(),
    }
    result[config.name] = ConfigParse.schema(ConfigAgentV1.Info, config, item)
  }
  return result
}

export async function loadMode(dir: string) {
  const result: Record<string, ConfigAgentV1.Info> = {}
  for (const item of await Glob.scan("{mode,modes}/*.md", {
    cwd: dir,
    absolute: true,
    dot: true,
    symlink: true,
  })) {
    const md = await ConfigMarkdown.parse(item).catch(() => undefined)
    if (!md) continue

    const config = {
      name: configEntryNameFromPath(path.relative(dir, item), ["mode/", "modes/"]),
      ...md.data,
      prompt: md.content.trim(),
    }
    const parsed = Schema.decodeUnknownExit(ConfigAgentV1.Info)(config, { errors: "all", propertyOrder: "original" })
    if (Exit.isSuccess(parsed)) {
      result[config.name] = {
        ...parsed.value,
        mode: "primary" as const,
      }
    }
  }
  return result
}

/** Claude Code agent frontmatter → Kiwii agent config. `tools: Read, Grep` becomes an allow-list; short model aliases mean "inherit". */
export function fromClaude(name: string, data: Record<string, unknown>, prompt: string): Record<string, unknown> {
  const { tools, disallowedTools, model, ...rest } = data
  const toPermission = (value: unknown) =>
    (typeof value === "string" ? value.split(",") : Array.isArray(value) ? value : [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => ConfigPermissionV1.parseClaudeRule(item))
      .filter((item): item is { permission: string; pattern: string } => item !== undefined)
  const allowed = toPermission(tools)
  const denied = toPermission(disallowedTools)
  const permission: Record<string, unknown> = {}
  if (allowed.length) {
    permission["*"] = "deny"
    for (const item of allowed) permission[item.permission] = "allow"
  }
  for (const item of denied) permission[item.permission] = "deny"
  const modelID = typeof model === "string" && model.includes("/") ? model : undefined
  return {
    name,
    mode: "subagent",
    ...rest,
    ...(modelID ? { model: modelID } : {}),
    ...(Object.keys(permission).length ? { permission } : {}),
    prompt,
  }
}

/** Load `.claude/agents/*.md` (Claude Code layout). Files that still fail to parse are skipped, never fatal. */
export async function loadClaude(dir: string) {
  const result: Record<string, ConfigAgentV1.Info> = {}
  for (const item of await Glob.scan("agents/**/*.md", { cwd: dir, absolute: true, dot: true, symlink: true })) {
    const md = await ConfigMarkdown.parse(item).catch(() => undefined)
    if (!md) continue
    const name = configEntryNameFromPath(path.relative(dir, item), ["agents/"])
    const config = fromClaude(name, md.data, md.content.trim())
    const parsed = Schema.decodeUnknownExit(ConfigAgentV1.Info)(config, { errors: "all", propertyOrder: "original" })
    if (Exit.isSuccess(parsed)) result[name] = parsed.value
  }
  return result
}
