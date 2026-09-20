import { describe, expect, test } from "bun:test"
import { rememberShortcut } from "../../src/component/prompt/index"

describe("rememberShortcut", () => {
  test("turns `# note` into a memory save instruction", () => {
    const out = rememberShortcut("# always run bun test before committing")
    expect(out).toContain('memory tool (action "save")')
    expect(out.endsWith("always run bun test before committing")).toBe(true)
  })

  test("leaves normal prompts and markdown headings untouched", () => {
    expect(rememberShortcut("fix the bug")).toBe("fix the bug")
    expect(rememberShortcut("#hashtag")).toBe("#hashtag")
    expect(rememberShortcut("# ")).toBe("# ")
  })
})
