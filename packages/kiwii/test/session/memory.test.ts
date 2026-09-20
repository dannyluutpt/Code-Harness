import { describe, expect, test } from "bun:test"
import { Memory } from "../../src/session/memory"

describe("Memory helpers", () => {
  test("slug is stable and filesystem safe", () => {
    const a = Memory.slug("/home/me/My Project")
    expect(a).toMatch(/^my-project-[0-9a-f]{8}$/)
    expect(Memory.slug("/home/me/My Project")).toBe(a)
    expect(Memory.slug("/home/me/other")).not.toBe(a)
  })

  test("parseEntries reads bullets only", () => {
    expect(Memory.parseEntries("# title\n\n- one\n  - two\nplain\n- \n- three")).toEqual(["one", "two", "three"])
  })

  test("parseExtracted handles NONE, think tags and limits", () => {
    expect(Memory.parseExtracted("NONE")).toEqual([])
    expect(Memory.parseExtracted("<think>hmm</think>\n- Use bun test, never npm test\n- ok")).toEqual([
      "Use bun test, never npm test",
    ])
    const many = Array.from({ length: 12 }, (_, i) => `- fact number ${i} is here`).join("\n")
    expect(Memory.parseExtracted(many)).toHaveLength(8)
  })

  test("merge dedupes case-insensitively and caps lines", () => {
    const first = Memory.merge("", ["Run `bun test` inside a package", "Prefer Effect generators"])
    expect(first.added).toHaveLength(2)
    expect(first.text).toContain("- Run `bun test` inside a package")
    const second = Memory.merge(first.text, ["run bun test inside a package", "- New: default branch is main"])
    expect(second.added).toEqual(["New: default branch is main"])
    expect(Memory.parseEntries(second.text)).toHaveLength(3)
    const capped = Memory.merge(second.text, ["x1", "x2"], 3)
    expect(Memory.parseEntries(capped.text)).toEqual(["New: default branch is main", "x1", "x2"])
  })
})
