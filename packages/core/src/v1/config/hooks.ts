export * as ConfigHooksV1 from "./hooks"

import { Schema } from "effect"

/** Hook events, named after their Claude Code equivalents. */
export const Event = Schema.Literals([
  "PreToolUse",
  "PostToolUse",
  "UserPromptSubmit",
  "Stop",
  "SessionStart",
  "SessionEnd",
  "Notification",
  "PreCompact",
  "PermissionRequest",
]).annotate({ identifier: "HookEvent" })
export type Event = Schema.Schema.Type<typeof Event>
export const EVENTS: ReadonlyArray<Event> = [
  "PreToolUse",
  "PostToolUse",
  "UserPromptSubmit",
  "Stop",
  "SessionStart",
  "SessionEnd",
  "Notification",
  "PreCompact",
  "PermissionRequest",
]

export const Command = Schema.Struct({
  type: Schema.Literal("command"),
  command: Schema.String.annotate({ description: "Shell command. Receives the event payload as JSON on stdin." }),
  timeout: Schema.optional(Schema.Number).annotate({ description: "Timeout in seconds (default 60)" }),
}).annotate({ identifier: "HookCommand" })
export type Command = Schema.Schema.Type<typeof Command>

export const Matcher = Schema.Struct({
  matcher: Schema.optional(Schema.String).annotate({
    description: "Tool name pattern (glob, `*` matches all). Ignored for events without a tool.",
  }),
  hooks: Schema.mutable(Schema.Array(Command)),
}).annotate({ identifier: "HookMatcher" })
export type Matcher = Schema.Schema.Type<typeof Matcher>

export const Info = Schema.Struct({
  PreToolUse: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  PostToolUse: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  UserPromptSubmit: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  Stop: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  SessionStart: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  SessionEnd: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  Notification: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  PreCompact: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
  PermissionRequest: Schema.optional(Schema.mutable(Schema.Array(Matcher))),
}).annotate({
  identifier: "HooksConfig",
  description:
    "Shell command hooks (Claude Code compatible). Exit code 2 blocks the action and feeds stderr back to the model; JSON on stdout may carry decision, reason, additionalContext or updatedInput.",
})
export type Info = Schema.Schema.Type<typeof Info>
