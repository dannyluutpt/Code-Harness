import { describe, expect, test } from "bun:test"
import { autoApprove } from "../../src/cli/cmd/run"

describe("permission modes", () => {
  test("default asks for everything", () => {
    expect(autoApprove("default", "edit")).toBe(false)
    expect(autoApprove("default", "bash")).toBe(false)
  })

  test("acceptEdits approves file edits only", () => {
    expect(autoApprove("acceptEdits", "edit")).toBe(true)
    expect(autoApprove("acceptEdits", "write")).toBe(true)
    expect(autoApprove("acceptEdits", "read")).toBe(true)
    expect(autoApprove("acceptEdits", "bash")).toBe(false)
    expect(autoApprove("acceptEdits", "webfetch")).toBe(false)
  })

  test("plan never auto-approves", () => {
    expect(autoApprove("plan", "edit")).toBe(false)
  })

  test("auto approves edits, read-only tools and safe shell commands only", () => {
    expect(autoApprove("auto", "edit")).toBe(true)
    expect(autoApprove("auto", "todowrite")).toBe(true)
    expect(autoApprove("auto", "webfetch")).toBe(false)
    expect(autoApprove("auto", "external_directory")).toBe(false)
    expect(autoApprove("auto", "bash")).toBe(false)
    expect(autoApprove("auto", "bash", ["git status --short", "bun test packages/tui"])).toBe(true)
    expect(autoApprove("auto", "bash", ["Get-ChildItem -Force"])).toBe(true)
    expect(autoApprove("auto", "bash", ["git status", "rm -rf dist"])).toBe(false)
    expect(autoApprove("auto", "bash", ["git push --force"])).toBe(false)
    expect(autoApprove("auto", "bash", ["git diff --output=x.patch"])).toBe(false)
    expect(autoApprove("auto", "bash", ["find . -name x -delete"])).toBe(false)
    expect(autoApprove("auto", "bash", ["echo hi > file.txt"])).toBe(false)
    expect(autoApprove("auto", "bash", ["ls ; rm -rf x"])).toBe(false)
    expect(autoApprove("auto", "bash", ["cat $(which node)"])).toBe(false)
    expect(autoApprove("auto", "bash", ["bun run deploy"])).toBe(false)
    expect(autoApprove("auto", "bash", ["bun testx"])).toBe(false)
  })

  test("bypassPermissions approves everything", () => {
    expect(autoApprove("bypassPermissions", "bash")).toBe(true)
    expect(autoApprove("bypassPermissions", "external_directory")).toBe(true)
  })
})
