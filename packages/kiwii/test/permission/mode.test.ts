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

  test("bypassPermissions approves everything", () => {
    expect(autoApprove("bypassPermissions", "bash")).toBe(true)
    expect(autoApprove("bypassPermissions", "external_directory")).toBe(true)
  })
})
