import { afterEach, describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { detectLlamaCpp } from "../../src/provider/provider"

const original = process.env["LLAMACPP_HOST"]

afterEach(() => {
  if (original === undefined) delete process.env["LLAMACPP_HOST"]
  else process.env["LLAMACPP_HOST"] = original
})

function serve(data: unknown) {
  const server = Bun.serve({ port: 0, fetch: () => Response.json({ object: "list", data }) })
  process.env["LLAMACPP_HOST"] = `http://localhost:${server.port}`
  return server
}

describe("llama.cpp auto-detection", () => {
  test("registers models served by llama-server", async () => {
    const server = serve([{ id: "C:/models/qwen3-coder-30b.gguf", object: "model", owned_by: "llamacpp" }])
    const info = await Effect.runPromise(detectLlamaCpp(undefined, undefined))
    await server.stop(true)
    expect(info?.npm).toBe("@ai-sdk/openai-compatible")
    expect(info?.options?.baseURL).toBe(`${process.env["LLAMACPP_HOST"]}/v1`)
    expect(info?.models?.["C:/models/qwen3-coder-30b.gguf"]?.name).toBe("qwen3-coder-30b.gguf")
  })

  test("ignores other OpenAI-compatible servers on the same port", async () => {
    const server = serve([{ id: "gpt-x", object: "model", owned_by: "someone-else" }])
    const info = await Effect.runPromise(detectLlamaCpp(undefined, undefined))
    await server.stop(true)
    expect(info).toBeUndefined()
  })

  test("skips when configured, disabled or unreachable", async () => {
    const server = serve([{ id: "m.gguf", owned_by: "llamacpp" }])
    expect(await Effect.runPromise(detectLlamaCpp({ llamacpp: {} }, undefined))).toBeUndefined()
    expect(await Effect.runPromise(detectLlamaCpp(undefined, ["llamacpp"]))).toBeUndefined()
    await server.stop(true)
    expect(await Effect.runPromise(detectLlamaCpp(undefined, undefined))).toBeUndefined()
  })
})
