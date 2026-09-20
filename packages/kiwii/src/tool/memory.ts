import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./memory.txt"
import { Memory } from "../session/memory"

export const Parameters = Schema.Struct({
  action: Schema.Literals(["save", "search", "list"]).annotate({
    description: "save: remember a durable fact; search: find notes by keyword; list: print the whole memory",
  }),
  content: Schema.optional(Schema.String).annotate({
    description: "The fact to save (one short line). Required for `save`.",
  }),
  query: Schema.optional(Schema.String).annotate({ description: "Keywords to search for. Required for `search`." }),
})

type Metadata = {
  action: "save" | "search" | "list"
  file?: string
  added?: string[]
  matches?: number
}

export const MemoryTool = Tool.define<typeof Parameters, Metadata, Memory.Service>(
  "memory",
  Effect.gen(function* () {
    const memory = yield* Memory.Service

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context<Metadata>) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "memory",
            patterns: [params.action],
            always: ["*"],
            metadata: { action: params.action },
          })

          if (params.action === "save") {
            const content = params.content?.trim()
            if (!content) throw new Error("`content` is required for save")
            const result = yield* memory.save([content])
            return {
              title: result.added.length ? "Saved to memory" : "Already in memory",
              output: result.added.length
                ? `Saved to ${result.file}:\n- ${result.added.join("\n- ")}`
                : `Memory already contains an equivalent note. File: ${result.file}`,
              metadata: { action: "save" as const, file: result.file, added: result.added },
            }
          }

          if (params.action === "search") {
            const query = params.query?.trim()
            if (!query) throw new Error("`query` is required for search")
            const matches = yield* memory.search(query)
            return {
              title: `${matches.length} memory match${matches.length === 1 ? "" : "es"}`,
              output: matches.length ? matches.map((entry) => `- ${entry}`).join("\n") : "No matching memory entries.",
              metadata: { action: "search" as const, matches: matches.length },
            }
          }

          const file = yield* memory.file()
          const entries = yield* memory.entries()
          return {
            title: `${entries.length} memory entries`,
            output: entries.length ? `${file}\n\n${entries.map((entry) => `- ${entry}`).join("\n")}` : `Memory is empty (${file}).`,
            metadata: { action: "list" as const, file },
          }
        }),
    } satisfies Tool.DefWithoutID<typeof Parameters, Metadata>
  }),
)
