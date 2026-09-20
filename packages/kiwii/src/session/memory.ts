import { LayerNode } from "@kiwii/core/effect/layer-node"
import { Global } from "@kiwii/core/global"
import { Flag } from "@kiwii/core/flag/flag"
import { Config } from "@/config/config"
import { InstanceState } from "@/effect/instance-state"
import { Context, Effect, Layer } from "effect"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import path from "path"

export const FILE = "MEMORY.md"
export const DEFAULT_MAX_LINES = 200
/** Number of new messages in a session before another automatic extraction runs. */
export const EXTRACT_EVERY = 6

const HEADER = "# Kiwii memory\n\nDurable notes about this project, saved across sessions. One fact per line.\n\n"

export interface Interface {
  readonly enabled: () => Effect.Effect<boolean>
  readonly file: () => Effect.Effect<string>
  readonly read: () => Effect.Effect<string>
  readonly entries: () => Effect.Effect<string[]>
  readonly save: (entries: ReadonlyArray<string>) => Effect.Effect<{ added: string[]; file: string }>
  readonly search: (query: string) => Effect.Effect<string[]>
  readonly system: () => Effect.Effect<string | undefined>
  readonly shouldExtract: (sessionID: string, messageCount: number) => Effect.Effect<boolean>
}

export class Service extends Context.Service<Service, Interface>()("@kiwii/Memory") {}

/** Stable per-project directory name: `<basename>-<hash>`. */
export function slug(worktree: string) {
  const base = path
    .basename(worktree)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const hash = createHash("sha1").update(worktree).digest("hex").slice(0, 8)
  return `${base || "project"}-${hash}`
}

/** Bullet entries of a MEMORY.md document (headings and blank lines ignored). */
export function parseEntries(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
}

/** Parse model output from the memory agent: `- fact` lines, or NONE. */
export function parseExtracted(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim()
  if (!cleaned || /^none\.?$/i.test(cleaned)) return []
  return parseEntries(cleaned)
    .map((line) => line.replace(/\s+/g, " "))
    .filter((line) => line.length >= 8 && line.length <= 240)
    .slice(0, 8)
}

function normalize(entry: string) {
  return entry.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

/** Append new unique entries and keep the file under `maxLines` bullets (oldest dropped first). */
export function merge(existing: string, entries: ReadonlyArray<string>, maxLines = DEFAULT_MAX_LINES) {
  const current = parseEntries(existing)
  const seen = new Set(current.map(normalize))
  const added = entries
    .map((entry) => entry.trim().replace(/^-\s*/, ""))
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      const key = normalize(entry)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  const all = [...current, ...added].slice(-maxLines)
  const body = all.map((entry) => `- ${entry}`).join("\n")
  return { added, text: `${HEADER}${body}${body ? "\n" : ""}` }
}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const global = yield* Global.Service
    const config = yield* Config.Service
    const extracted = new Map<string, number>()

    const enabled = Effect.fn("Memory.enabled")(function* () {
      return !Flag.KIWII_DISABLE_MEMORY
    })

    const maxLines = Effect.fn("Memory.maxLines")(function* () {
      const cfg = yield* config.get()
      return cfg.memory?.max_lines ?? DEFAULT_MAX_LINES
    })

    // Project-local `.kiwii/memory/` wins when it exists; otherwise the per-project data directory.
    const file = Effect.fn("Memory.file")(function* () {
      const ctx = yield* InstanceState.context
      const worktree = ctx.worktree === "/" ? ctx.directory : ctx.worktree
      const local = path.join(worktree, ".kiwii", "memory", FILE)
      const hasLocal = yield* Effect.promise(() =>
        fs
          .stat(path.dirname(local))
          .then((stat) => stat.isDirectory())
          .catch(() => false),
      )
      if (hasLocal) return local
      return path.join(global.data, "memory", slug(worktree), FILE)
    })

    const read = Effect.fn("Memory.read")(function* () {
      const target = yield* file()
      return yield* Effect.promise(() => fs.readFile(target, "utf8").catch(() => ""))
    })

    const entries = Effect.fn("Memory.entries")(function* () {
      return parseEntries(yield* read())
    })

    const save = Effect.fn("Memory.save")(function* (items: ReadonlyArray<string>) {
      const target = yield* file()
      const existing = yield* read()
      const result = merge(existing, items, yield* maxLines())
      if (result.added.length > 0) {
        yield* Effect.promise(async () => {
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.writeFile(target, result.text, "utf8")
        })
      }
      return { added: result.added, file: target }
    })

    const search = Effect.fn("Memory.search")(function* (query: string) {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
      if (terms.length === 0) return yield* entries()
      return (yield* entries()).filter((entry) => {
        const lower = entry.toLowerCase()
        return terms.some((term) => lower.includes(term))
      })
    })

    const system = Effect.fn("Memory.system")(function* () {
      if (!(yield* enabled())) return undefined
      const target = yield* file()
      const list = (yield* entries()).slice(-(yield* maxLines()))
      if (list.length === 0) return undefined
      return [
        "<memory>",
        `Long-term notes saved from earlier Kiwii sessions in this project (${target}).`,
        "Use them when relevant, and call the `memory` tool to save new durable facts (preferences, commands, gotchas).",
        ...list.map((entry) => `- ${entry}`),
        "</memory>",
      ].join("\n")
    })

    const shouldExtract = Effect.fn("Memory.shouldExtract")(function* (sessionID: string, messageCount: number) {
      if (!(yield* enabled())) return false
      const cfg = yield* config.get()
      if (cfg.memory?.auto === false) return false
      const last = extracted.get(sessionID) ?? 0
      if (messageCount - last < EXTRACT_EVERY) return false
      extracted.set(sessionID, messageCount)
      return true
    })

    return Service.of({ enabled, file, read, entries, save, search, system, shouldExtract })
  }),
)

export const node = LayerNode.make({ service: Service, layer, deps: [Global.node, Config.node] })

export * as Memory from "./memory"
