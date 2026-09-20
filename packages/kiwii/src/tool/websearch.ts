import { Effect, Schema } from "effect"
import { HttpClient } from "effect/unstable/http"
import * as Tool from "./tool"
import * as McpWebSearch from "./mcp-websearch"
import DESCRIPTION from "./websearch.txt"
import { checksum } from "@kiwii/core/util/encode"
import { InstallationVersion } from "@kiwii/core/installation/version"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { Config } from "@/config/config"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({ description: "Websearch query" }),
  numResults: Schema.optional(Schema.Number).annotate({
    description: "Number of search results to return (default: 8)",
  }),
  livecrawl: Schema.optional(Schema.Literals(["fallback", "preferred"])).annotate({
    description:
      "Live crawl mode - 'fallback': use live crawling as backup if cached content unavailable, 'preferred': prioritize live crawling (default: 'fallback')",
  }),
  type: Schema.optional(Schema.Literals(["auto", "fast", "deep"])).annotate({
    description: "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive search",
  }),
  contextMaxCharacters: Schema.optional(Schema.Number).annotate({
    description: "Maximum characters for context string optimized for LLMs (default: 10000)",
  }),
})

const WebSearchProviderSchema = Schema.Literals(["exa", "parallel", "tavily", "brave"])
export type WebSearchProvider = Schema.Schema.Type<typeof WebSearchProviderSchema>
const PROVIDERS: ReadonlyArray<WebSearchProvider> = ["exa", "parallel", "tavily", "brave"]

export type WebSearchConfig = { provider?: WebSearchProvider; api_key?: string }

export function isWebSearchProvider(value: unknown): value is WebSearchProvider {
  return typeof value === "string" && (PROVIDERS as ReadonlyArray<string>).includes(value)
}

/** API key for a provider: config value first, then the provider's env var. */
export function webSearchApiKey(provider: WebSearchProvider, config?: WebSearchConfig, env = process.env) {
  if (config?.provider === provider && config.api_key) return config.api_key
  const names: Record<WebSearchProvider, string> = {
    exa: "EXA_API_KEY",
    parallel: "PARALLEL_API_KEY",
    tavily: "TAVILY_API_KEY",
    brave: "BRAVE_API_KEY",
  }
  return env[names[provider]]
}

/**
 * Pick the search backend: config > KIWII_WEBSEARCH_PROVIDER > legacy flags > first provider with a key.
 * Exa needs no key, so web search always works out of the box.
 */
export function selectWebSearchProvider(
  sessionID: string,
  flags = { exa: false, parallel: false },
  config?: WebSearchConfig,
  env = process.env,
): WebSearchProvider {
  void sessionID
  void checksum
  if (isWebSearchProvider(config?.provider)) return config.provider
  const override = env.KIWII_WEBSEARCH_PROVIDER
  if (isWebSearchProvider(override)) return override
  if (flags.parallel) return "parallel"
  if (flags.exa) return "exa"
  for (const provider of ["tavily", "brave", "parallel"] as const) {
    if (webSearchApiKey(provider, config, env)) return provider
  }
  return "exa"
}

export function webSearchProviderLabel(provider: unknown) {
  if (provider === "parallel") return "Parallel Web Search"
  if (provider === "exa") return "Exa Web Search"
  if (provider === "tavily") return "Tavily Web Search"
  if (provider === "brave") return "Brave Web Search"
  return "Web Search"
}

const TavilyResponse = Schema.Struct({
  answer: Schema.optional(Schema.NullOr(Schema.String)),
  results: Schema.optional(
    Schema.Array(
      Schema.Struct({
        title: Schema.optional(Schema.String),
        url: Schema.String,
        content: Schema.optional(Schema.String),
      }),
    ),
  ),
})

const BraveResponse = Schema.Struct({
  web: Schema.optional(
    Schema.Struct({
      results: Schema.optional(
        Schema.Array(
          Schema.Struct({
            title: Schema.optional(Schema.String),
            url: Schema.String,
            description: Schema.optional(Schema.String),
          }),
        ),
      ),
    }),
  ),
})

export function formatResults(items: ReadonlyArray<{ title?: string; url: string; snippet?: string }>, answer?: string) {
  const lines = items.map((item, index) =>
    [`${index + 1}. ${item.title?.trim() || item.url}`, `   ${item.url}`, item.snippet ? `   ${item.snippet.trim()}` : undefined]
      .filter(Boolean)
      .join("\n"),
  )
  return [answer ? `Answer: ${answer.trim()}` : undefined, ...lines].filter(Boolean).join("\n\n")
}

function tavily(query: string, numResults: number, key: string) {
  return Effect.tryPromise(async () => {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, max_results: numResults, include_answer: true }),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) throw new Error(`Tavily search failed: ${res.status} ${await res.text().catch(() => "")}`)
    return res.json()
  }).pipe(
    Effect.flatMap((json) => Schema.decodeUnknownEffect(TavilyResponse)(json)),
    Effect.map((data) =>
      formatResults(
        (data.results ?? []).map((item) => ({ title: item.title, url: item.url, snippet: item.content })),
        data.answer ?? undefined,
      ),
    ),
  )
}

function brave(query: string, numResults: number, key: string) {
  return Effect.tryPromise(async () => {
    const url = new URL("https://api.search.brave.com/res/v1/web/search")
    url.searchParams.set("q", query)
    url.searchParams.set("count", String(Math.min(numResults, 20)))
    const res = await fetch(url, {
      headers: { accept: "application/json", "X-Subscription-Token": key },
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) throw new Error(`Brave search failed: ${res.status} ${await res.text().catch(() => "")}`)
    return res.json()
  }).pipe(
    Effect.flatMap((json) => Schema.decodeUnknownEffect(BraveResponse)(json)),
    Effect.map((data) =>
      formatResults(
        (data.web?.results ?? []).map((item) => ({ title: item.title, url: item.url, snippet: item.description })),
      ),
    ),
  )
}

export function webSearchModelName(extra: Tool.Context["extra"]) {
  const model = extra?.model
  if (!model || typeof model !== "object") return undefined
  const api = "api" in model && model.api && typeof model.api === "object" ? model.api : undefined
  const apiID = api && "id" in api && typeof api.id === "string" ? api.id : undefined
  const id = "id" in model && typeof model.id === "string" ? model.id : undefined
  return (apiID ?? id)?.slice(0, 100)
}

function parallelAuthHeaders(key?: string) {
  const headers = { "User-Agent": `kiwii/${InstallationVersion}` }
  if (!key) return headers
  return { ...headers, Authorization: `Bearer ${key}` }
}

function callProvider(
  http: HttpClient.HttpClient,
  provider: WebSearchProvider,
  params: Schema.Schema.Type<typeof Parameters>,
  ctx: Tool.Context,
  config?: WebSearchConfig,
) {
  const key = webSearchApiKey(provider, config)
  if (provider === "tavily") {
    if (!key) return Effect.fail(new Error("Tavily web search requires TAVILY_API_KEY or websearch.api_key"))
    return tavily(params.query, params.numResults || 8, key)
  }
  if (provider === "brave") {
    if (!key) return Effect.fail(new Error("Brave web search requires BRAVE_API_KEY or websearch.api_key"))
    return brave(params.query, params.numResults || 8, key)
  }
  if (provider === "parallel") {
    return McpWebSearch.call(
      http,
      McpWebSearch.PARALLEL_URL,
      "web_search",
      McpWebSearch.ParallelSearchArgs,
      {
        objective: params.query,
        search_queries: [params.query],
        session_id: ctx.sessionID,
        model_name: webSearchModelName(ctx.extra),
      },
      "25 seconds",
      parallelAuthHeaders(key),
    )
  }

  return McpWebSearch.call(
    http,
    McpWebSearch.exaUrl(key),
    "web_search_exa",
    McpWebSearch.SearchArgs,
    {
      query: params.query,
      type: params.type || "auto",
      numResults: params.numResults || 8,
      livecrawl: params.livecrawl || "fallback",
      contextMaxCharacters: params.contextMaxCharacters,
    },
    "25 seconds",
  )
}

export const WebSearchTool = Tool.define(
  "websearch",
  Effect.gen(function* () {
    const http = yield* HttpClient.HttpClient
    const flags = yield* RuntimeFlags.Service
    const config = yield* Config.Service

    return {
      get description() {
        return DESCRIPTION.replace("{{year}}", new Date().getFullYear().toString())
      },
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const search = (yield* config.get()).websearch
          const provider = selectWebSearchProvider(
            ctx.sessionID,
            { exa: flags.enableExa, parallel: flags.enableParallel },
            search,
          )
          const title = webSearchProviderLabel(provider)
          yield* ctx.metadata({ title: `${title} "${params.query}"`, metadata: { provider } })

          yield* ctx.ask({
            permission: "websearch",
            patterns: [params.query],
            always: ["*"],
            metadata: {
              query: params.query,
              numResults: params.numResults,
              livecrawl: params.livecrawl,
              type: params.type,
              contextMaxCharacters: params.contextMaxCharacters,
              provider,
            },
          })

          const result = yield* callProvider(http, provider, params, ctx, search)

          return {
            output: result ?? "No search results found. Please try a different query.",
            title: `${title}: ${params.query}`,
            metadata: { provider },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
