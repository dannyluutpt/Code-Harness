import { describe, expect, test } from "bun:test"
import { autoApprove, CYCLE_MODES, isPermissionMode, permissionModeLabel } from "../../src/context/permission"

describe("tui permission modes", () => {
  test("cycle order excludes bypassPermissions", () => {
    expect(CYCLE_MODES).toEqual(["default", "acceptEdits", "plan"])
  })

  test("labels and guards", () => {
    expect(permissionModeLabel("acceptEdits")).toBe("accept edits")
    expect(isPermissionMode("bypassPermissions")).toBe(true)
    expect(isPermissionMode("auto")).toBe(false)
  })

  test("autoApprove mirrors the cli behaviour", () => {
    expect(autoApprove("acceptEdits", "edit")).toBe(true)
    expect(autoApprove("acceptEdits", "bash")).toBe(false)
    expect(autoApprove("bypassPermissions", "bash")).toBe(true)
    expect(autoApprove("plan", "read")).toBe(false)
  })
})
