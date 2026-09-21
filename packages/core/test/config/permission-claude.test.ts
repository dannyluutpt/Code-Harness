import { describe, expect, test } from "bun:test"
import { ConfigPermissionV1 } from "../../src/v1/config/permission"

describe("ConfigPermissionV1.parseClaudeRule", () => {
  test("maps tool names to permissions", () => {
    expect(ConfigPermissionV1.parseClaudeRule("Bash(git *)")).toEqual({ permission: "bash", pattern: "git *" })
    expect(ConfigPermissionV1.parseClaudeRule("Edit(src/**)")).toEqual({ permission: "edit", pattern: "src/**" })
    expect(ConfigPermissionV1.parseClaudeRule("Write")).toEqual({ permission: "edit", pattern: "*" })
    expect(ConfigPermissionV1.parseClaudeRule("Read(~/.env)")).toEqual({ permission: "read", pattern: "~/.env" })
  })

  test("supports claude code spellings", () => {
    expect(ConfigPermissionV1.parseClaudeRule("Bash(npm run:*)")).toEqual({ permission: "bash", pattern: "npm run *" })
    expect(ConfigPermissionV1.parseClaudeRule("WebFetch(domain:example.com)")).toEqual({
      permission: "webfetch",
      pattern: "*example.com*",
    })
    expect(ConfigPermissionV1.parseClaudeRule("mcp__github__list_issues")).toEqual({
      permission: "mcp__github__list_issues",
      pattern: "*",
    })
  })

  test("ignores malformed entries", () => {
    expect(ConfigPermissionV1.parseClaudeRule("")).toBeUndefined()
    expect(ConfigPermissionV1.parseClaudeRule("(broken")).toBeUndefined()
  })
})

describe("ConfigPermissionV1.fromClaudeRules", () => {
  test("emits allow before deny so deny wins", () => {
    const result = ConfigPermissionV1.fromClaudeRules({
      allow: ["Bash(git *)", "Edit(src/**)"],
      ask: ["Bash(rm *)"],
      deny: ["Bash(git push *)", "Read(.env)"],
    })
    expect(Object.keys(result.bash as object)).toEqual(["git *", "rm *", "git push *"])
    expect(result).toEqual({
      bash: { "git *": "allow", "rm *": "ask", "git push *": "deny" },
      edit: { "src/**": "allow" },
      read: { ".env": "deny" },
    })
  })
})

describe("ConfigPermissionV1.isMode", () => {
  test("accepts the claude code modes", () => {
    for (const mode of ConfigPermissionV1.MODES) expect(ConfigPermissionV1.isMode(mode)).toBe(true)
    expect(ConfigPermissionV1.isMode("auto")).toBe(true)
    expect(ConfigPermissionV1.isMode("yolo")).toBe(false)
    expect(ConfigPermissionV1.isMode(undefined)).toBe(false)
  })
})

describe("ConfigPermissionV1.autoApprove", () => {
  test("auto approves safe shell commands only", () => {
    expect(ConfigPermissionV1.autoApprove("auto", "bash", ["git status", "rg TODO src"])).toBe(true)
    expect(ConfigPermissionV1.autoApprove("auto", "bash", ["git status", "rm -rf dist"])).toBe(false)
    expect(ConfigPermissionV1.autoApprove("auto", "bash", ["ls ; rm -rf x"])).toBe(false)
    expect(ConfigPermissionV1.autoApprove("auto", "bash", ["echo hi > file"])).toBe(false)
    expect(ConfigPermissionV1.autoApprove("auto", "bash")).toBe(false)
    expect(ConfigPermissionV1.autoApprove("auto", "webfetch")).toBe(false)
    expect(ConfigPermissionV1.autoApprove("default", "edit")).toBe(false)
  })
})
