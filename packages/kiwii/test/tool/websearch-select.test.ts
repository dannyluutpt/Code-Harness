import { describe, expect, test } from "bun:test"
import { formatResults, selectWebSearchProvider, webSearchApiKey } from "../../src/tool/websearch"

const none = { exa: false, parallel: false }

describe("websearch provider selection", () => {
  test("defaults to exa without keys", () => {
    expect(selectWebSearchProvider("s", none, undefined, {})).toBe("exa")
  })

  test("config wins over env", () => {
    expect(selectWebSearchProvider("s", none, { provider: "brave" }, { TAVILY_API_KEY: "x" })).toBe("brave")
    expect(selectWebSearchProvider("s", none, undefined, { KIWII_WEBSEARCH_PROVIDER: "parallel" })).toBe("parallel")
  })

  test("first provider with a key is used", () => {
    expect(selectWebSearchProvider("s", none, undefined, { BRAVE_API_KEY: "b" })).toBe("brave")
    expect(selectWebSearchProvider("s", none, undefined, { TAVILY_API_KEY: "t", BRAVE_API_KEY: "b" })).toBe("tavily")
  })

  test("api key resolution prefers config", () => {
    expect(webSearchApiKey("tavily", { provider: "tavily", api_key: "cfg" }, { TAVILY_API_KEY: "env" })).toBe("cfg")
    expect(webSearchApiKey("tavily", { provider: "brave", api_key: "cfg" }, { TAVILY_API_KEY: "env" })).toBe("env")
    expect(webSearchApiKey("exa", undefined, {})).toBeUndefined()
  })

  test("formatResults renders numbered entries", () => {
    const text = formatResults([{ title: "Bun", url: "https://bun.sh", snippet: "fast" }], "use bun")
    expect(text).toContain("Answer: use bun")
    expect(text).toContain("1. Bun")
    expect(text).toContain("https://bun.sh")
  })
})
