import { describe, expect, test } from "bun:test"
import { ConfigClaude } from "../../src/config/claude"
import { normalizeArgv } from "../../src/cli/argv"

describe("ConfigClaude", () => {
  test("parses permissions, hooks and env from settings.json", () => {
    const parsed = ConfigClaude.parse(
      JSON.stringify({
        permissions: { allow: ["Bash(git *)", 5], deny: ["Read(.env)"], defaultMode: "acceptEdits" },
        hooks: {
          PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi", timeout: 5 }] }],
          Unknown: [{ hooks: [{ type: "command", command: "nope" }] }],
          Stop: [{ hooks: [{ type: "prompt", prompt: "not supported" }] }],
        },
        env: { FOO: "bar", NUM: 1 },
        model: "opus",
      }),
    )
    expect(parsed).toBeDefined()
    const config = ConfigClaude.toConfig(parsed!)
    expect(config.permissions).toEqual({ allow: ["Bash(git *)"], deny: ["Read(.env)"] })
    expect(config.hooks).toEqual({
      PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi", timeout: 5 }] }],
    })
    expect(config.env).toEqual({ FOO: "bar" })
  })

  test("ignores invalid documents", () => {
    expect(ConfigClaude.parse("not json")).toBeUndefined()
    expect(ConfigClaude.parse("[]")).toBeUndefined()
    expect(ConfigClaude.toConfig({}).permissions).toBeUndefined()
  })

  test("lists global then project settings files", () => {
    expect(ConfigClaude.candidates("/home/me", ["/repo/.claude"])).toEqual([
      "/home/me/.claude/settings.json",
      "/repo/.claude/settings.json",
      "/repo/.claude/settings.local.json",
    ])
  })
})

describe("normalizeArgv", () => {
  test("maps -p to run", () => {
    expect(normalizeArgv(["-p", "hello"])).toEqual(["run", "hello"])
    expect(normalizeArgv(["--print", "hello", "--format", "json"])).toEqual(["run", "hello", "--format", "json"])
    expect(normalizeArgv(["run", "-p", "pw"])).toEqual(["run", "-p", "pw"])
    expect(normalizeArgv([])).toEqual([])
  })
})
