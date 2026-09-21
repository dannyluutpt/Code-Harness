import { describe, expect, test } from "bun:test"
import type { AssistantMessage, Part } from "@kiwii/sdk/v2"
import { speedLabel, turnSpeed } from "../../src/util/usage"

function message(output: number, created: number, completed?: number) {
  return {
    id: `msg-${created}`,
    role: "assistant",
    time: { created, completed },
    tokens: { input: 0, output, reasoning: 0, cache: { read: 0, write: 0 } },
  } as AssistantMessage
}

function text(start: number, end?: number) {
  return { type: "text", text: "hi", time: { start, end } } as Part
}

describe("turn speed", () => {
  test("counts streaming spans and ignores the tool call between them", () => {
    // 200 tokens over two one-second spans, with ten seconds of tool work in between.
    const speed = turnSpeed([
      { message: message(100, 0, 60_000), parts: [text(0, 1_000)] },
      { message: message(100, 11_000, 60_000), parts: [text(11_000, 12_000)] },
    ])
    expect(speed).toBe(100)
  })

  test("falls back to the wall clock when parts carry no timing", () => {
    expect(turnSpeed([{ message: message(50, 1_000, 3_000), parts: [] }])).toBe(25)
  })

  test("ignores a span that is still streaming", () => {
    expect(turnSpeed([{ message: message(10, 0, 2_000), parts: [text(0)] }])).toBe(5)
  })

  test("undefined when there is nothing to measure", () => {
    expect(turnSpeed([])).toBeUndefined()
    expect(turnSpeed([{ message: message(0, 0, 1_000), parts: [] }])).toBeUndefined()
    expect(turnSpeed([{ message: message(10, 5_000, 5_000), parts: [] }])).toBeUndefined()
  })

  test("labels keep one decimal only below ten", () => {
    expect(speedLabel(42.4)).toBe("42 tok/s")
    expect(speedLabel(9.26)).toBe("9.3 tok/s")
  })
})
