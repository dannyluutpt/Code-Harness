export * as ConfigPermissionV1 from "./permission"

import { Schema, SchemaGetter } from "effect"

export const Action = Schema.Literals(["ask", "allow", "deny"]).annotate({ identifier: "PermissionActionConfig" })
export type Action = Schema.Schema.Type<typeof Action>

export const Object = Schema.Record(Schema.String, Action).annotate({ identifier: "PermissionObjectConfig" })
export type Object = Schema.Schema.Type<typeof Object>

export const Rule = Schema.Union([Action, Object]).annotate({ identifier: "PermissionRuleConfig" })
export type Rule = Schema.Schema.Type<typeof Rule>

// Known permission keys get explicit types in the Effect schema for generated
// docs/types. Runtime config parsing uses Effect's `propertyOrder: "original"`
// parse option so user key order is preserved for permission precedence.
const InputObject = Schema.StructWithRest(
  Schema.Struct({
    read: Schema.optional(Rule),
    edit: Schema.optional(Rule),
    glob: Schema.optional(Rule),
    grep: Schema.optional(Rule),
    list: Schema.optional(Rule),
    bash: Schema.optional(Rule),
    task: Schema.optional(Rule),
    external_directory: Schema.optional(Rule),
    todowrite: Schema.optional(Action),
    question: Schema.optional(Action),
    webfetch: Schema.optional(Action),
    websearch: Schema.optional(Action),
    lsp: Schema.optional(Rule),
    doom_loop: Schema.optional(Action),
    skill: Schema.optional(Rule),
  }),
  [Schema.Record(Schema.String, Rule)],
)

const InputSchema = Schema.Union([Action, InputObject])

const normalizeInput = (input: Schema.Schema.Type<typeof InputSchema>): Schema.Schema.Type<typeof InputObject> =>
  typeof input === "string" ? { "*": input } : input

export const Info = InputSchema.pipe(
  Schema.decodeTo(InputObject, {
    decode: SchemaGetter.transform(normalizeInput),
    encode: SchemaGetter.passthrough({ strict: false }),
  }),
).annotate({ identifier: "PermissionConfig" })
type _Info = Schema.Schema.Type<typeof InputObject>
export type Info = { -readonly [K in keyof _Info]: _Info[K] }

// ---------------------------------------------------------------------------
// Claude Code compatible permission modes and allow/deny lists.
// ---------------------------------------------------------------------------

export const Mode = Schema.Literals(["default", "acceptEdits", "plan", "bypassPermissions"]).annotate({
  identifier: "PermissionMode",
  description:
    "Permission mode. default: ask per rules; acceptEdits: auto-approve file edits; plan: read-only planning; bypassPermissions: approve everything not explicitly denied.",
})
export type Mode = Schema.Schema.Type<typeof Mode>
export const MODES: ReadonlyArray<Mode> = ["default", "acceptEdits", "plan", "bypassPermissions"]

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as ReadonlyArray<string>).includes(value)
}

/** Claude Code style rule lists: `Bash(git *)`, `Edit(src/**)`, `Read`, `mcp__server__tool`. */
export const ClaudeRules = Schema.Struct({
  allow: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  ask: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  deny: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
}).annotate({
  identifier: "PermissionsClaudeConfig",
  description: "Claude Code compatible allow/ask/deny lists. Entries look like `Bash(npm run *)`, `Edit(src/**)` or `WebFetch`.",
})
export type ClaudeRules = Schema.Schema.Type<typeof ClaudeRules>

const TOOL_TO_PERMISSION: Record<string, string> = {
  bash: "bash",
  edit: "edit",
  write: "edit",
  multiedit: "edit",
  notebookedit: "edit",
  read: "read",
  glob: "glob",
  grep: "grep",
  ls: "list",
  list: "list",
  webfetch: "webfetch",
  websearch: "websearch",
  task: "task",
  agent: "task",
  skill: "skill",
  todowrite: "todowrite",
  question: "question",
  askuserquestion: "question",
  lsp: "lsp",
}

export function parseClaudeRule(entry: string): { permission: string; pattern: string } | undefined {
  const trimmed = entry.trim()
  if (!trimmed) return
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_-]*)(?:\((.*)\))?$/s)
  if (!match) return
  const tool = match[1]!
  const raw = match[2]?.trim()
  const permission = TOOL_TO_PERMISSION[tool.toLowerCase()] ?? tool
  if (raw === undefined || raw === "") return { permission, pattern: "*" }
  // `Bash(git:*)` and `WebFetch(domain:example.com)` are Claude Code spellings.
  const domain = raw.match(/^domain:(.+)$/)
  if (domain) return { permission, pattern: `*${domain[1]!.trim()}*` }
  const pattern = raw.replace(/:\*$/, " *").replace(/:(?=[^/])/, " ")
  return { permission, pattern }
}

/** Convert Claude Code style lists into the ordered kiwii ruleset. Later entries win, so deny is emitted last. */
export function fromClaudeRules(rules: ClaudeRules): Info {
  const result: Record<string, Record<string, Action>> = {}
  const push = (entries: ReadonlyArray<string> | undefined, action: Action) => {
    for (const entry of entries ?? []) {
      const parsed = parseClaudeRule(entry)
      if (!parsed) continue
      result[parsed.permission] = { ...(result[parsed.permission] ?? {}), [parsed.pattern]: action }
    }
  }
  push(rules.allow, "allow")
  push(rules.ask, "ask")
  push(rules.deny, "deny")
  return result as Info
}
