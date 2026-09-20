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

export const Mode = Schema.Literals(["default", "acceptEdits", "plan", "auto", "bypassPermissions"]).annotate({
  identifier: "PermissionMode",
  description:
    "Permission mode. default: ask per rules; acceptEdits: auto-approve file edits; plan: read-only planning; auto: auto-approve edits, read-only tools and known-safe shell commands, ask for the rest; bypassPermissions: approve everything not explicitly denied.",
})
export type Mode = Schema.Schema.Type<typeof Mode>
export const MODES: ReadonlyArray<Mode> = ["default", "acceptEdits", "plan", "auto", "bypassPermissions"]

export function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as ReadonlyArray<string>).includes(value)
}

/** Permissions auto-approved in acceptEdits mode. */
export const EDIT_PERMISSIONS = new Set(["edit", "write", "apply_patch", "read", "glob", "grep", "list"])

/** Permissions auto-approved in auto mode, on top of safe shell commands. */
const AUTO_PERMISSIONS = new Set([...EDIT_PERMISSIONS, "todowrite", "lsp", "skill", "task", "websearch"])

// Read-only commands. Anything that can write, delete, reach the network or run arbitrary code stays out.
const SAFE_COMMANDS = new Set([
  "ls",
  "dir",
  "pwd",
  "cd",
  "cat",
  "head",
  "tail",
  "wc",
  "echo",
  "which",
  "where",
  "whoami",
  "date",
  "tree",
  "file",
  "stat",
  "du",
  "df",
  "grep",
  "rg",
  "find",
  "sort",
  "uniq",
  "cut",
  "diff",
  "basename",
  "dirname",
  "realpath",
  "true",
  "get-childitem",
  "get-content",
  "get-location",
  "get-item",
  "get-command",
  "select-string",
  "select-object",
  "where-object",
  "sort-object",
  "measure-object",
  "test-path",
  "resolve-path",
  "write-output",
])

const SAFE_SUBCOMMANDS: Record<string, ReadonlyArray<string>> = {
  git: ["status", "diff", "log", "show", "rev-parse", "ls-files", "blame", "describe", "shortlog", "grep"],
  bun: ["test", "typecheck", "lint", "run test", "run typecheck", "run lint", "run build"],
  npm: ["test", "run test", "run typecheck", "run lint", "run build"],
  pnpm: ["test", "typecheck", "lint", "run test", "run typecheck", "run lint", "run build"],
  yarn: ["test", "typecheck", "lint", "run test", "run typecheck", "run lint", "run build"],
  cargo: ["check", "test", "clippy", "build"],
  go: ["test", "vet", "build"],
  tsc: ["--noEmit"],
  tsgo: ["--noEmit"],
}

// Arguments that turn an otherwise read-only command into one that writes or executes.
const UNSAFE_ARGS: Record<string, ReadonlyArray<string>> = {
  find: ["-exec", "-execdir", "-ok", "-okdir", "-delete", "-fprint", "-fls"],
  sort: ["-o", "--output"],
  git: ["--output", "--ext-diff"],
}

/** Whether a single shell command (one entry of a bash permission request's patterns) is known to be safe. */
export function safeCommand(command: string) {
  // Patterns arrive split per command, so any operator left over means the parser could not split it: ask.
  if (/[>`\n;|&]|\$\(|<\(/.test(command)) return false
  const tokens = command.trim().split(/\s+/)
  const cmd = tokens[0]?.toLowerCase().replace(/\.exe$/, "")
  if (!cmd) return false
  if (UNSAFE_ARGS[cmd]?.some((arg) => tokens.some((token) => token.startsWith(arg)))) return false
  if (SAFE_COMMANDS.has(cmd)) return true
  const rest = tokens.slice(1).join(" ")
  return SAFE_SUBCOMMANDS[cmd]?.some((sub) => rest === sub || rest.startsWith(sub + " ")) ?? false
}

/** Whether a permission request is auto-approved under the given mode. */
export function autoApprove(mode: Mode, permission: string, patterns: ReadonlyArray<string> = []) {
  if (mode === "bypassPermissions") return true
  if (mode === "acceptEdits") return EDIT_PERMISSIONS.has(permission)
  if (mode !== "auto") return false
  if (permission === "bash") return patterns.length > 0 && patterns.every(safeCommand)
  return AUTO_PERMISSIONS.has(permission)
}

/** Claude Code style rule lists: `Bash(git *)`, `Edit(src/**)`, `Read`, `mcp__server__tool`. */
export const ClaudeRules = Schema.Struct({
  allow: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  ask: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
  deny: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
}).annotate({
  identifier: "PermissionsClaudeConfig",
  description:
    "Claude Code compatible allow/ask/deny lists. Entries look like `Bash(npm run *)`, `Edit(src/**)` or `WebFetch`.",
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
