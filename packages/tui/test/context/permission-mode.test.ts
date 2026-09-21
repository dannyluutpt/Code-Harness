import { describe, expect, test } from "bun:test"
import {
  autoApprove,
  CYCLE_MODES,
  isPermissionMode,
  nextPermissionMode,
  PERMISSION_MODE_ALIASES,
  permissionModeLabel,
} from "../../src/context/permission"

describe("tui permission modes", () => {
  test("cycle order excludes bypassPermissions until it was enabled", () => {
    expect(CYCLE_MODES).toEqual(["default", "acceptEdits", "plan", "auto"])
    expect(nextPermissionMode("auto", false)).toBe("default")
    expect(nextPermissionMode("auto", true)).toBe("bypassPermissions")
    expect(nextPermissionMode("bypassPermissions", true)).toBe("default")
    expect(nextPermissionMode("bypassPermissions", false)).toBe("default")
  })

  test("labels, guards and aliases", () => {
    expect(permissionModeLabel("default")).toBe("manual")
    expect(permissionModeLabel("acceptEdits")).toBe("accept edits")
    expect(isPermissionMode("bypassPermissions")).toBe(true)
    expect(isPermissionMode("auto")).toBe(true)
    expect(isPermissionMode("yolo")).toBe(false)
    expect(PERMISSION_MODE_ALIASES["manual"]).toBe("default")
    expect(PERMISSION_MODE_ALIASES["bypass"]).toBe("bypassPermissions")
  })

  test("autoApprove mirrors the cli behaviour", () => {
    expect(autoApprove("acceptEdits", "edit")).toBe(true)
    expect(autoApprove("acceptEdits", "bash")).toBe(false)
    expect(autoApprove("bypassPermissions", "bash")).toBe(true)
    expect(autoApprove("plan", "read")).toBe(false)
  })
})
