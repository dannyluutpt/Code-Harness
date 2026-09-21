import { describe, expect, test } from "bun:test"
import { base64Encode } from "@kiwii/core/util/encode"
import {
  autoRespondsPermission,
  directoryPermissionMode,
  migratePermissionModes,
  permissionMode,
  sessionPermissionMode,
  type PermissionModes,
} from "./permission-auto-respond"

const directory = "/tmp/project"
const key = (id: string) => `${base64Encode(directory)}/${id}`
const family = [{ id: "root" }, { id: "child", parentID: "root" }, { id: "other" }]
const request = (sessionID: string, permission = "bash", patterns = ["rm -rf build"]) => ({
  sessionID,
  permission,
  patterns,
})

describe("permissionMode", () => {
  test("uses a parent session's directory-scoped mode", () => {
    expect(permissionMode({ [key("root")]: "auto" }, family, { sessionID: "child" }, directory)).toBe("auto")
  })

  test("uses a parent session's legacy key", () => {
    expect(permissionMode({ root: "acceptEdits" }, family, { sessionID: "child" }, directory)).toBe("acceptEdits")
  })

  test("defaults to manual when no lineage or directory mode exists", () => {
    expect(permissionMode({ other: "bypassPermissions" }, family, { sessionID: "child" }, directory)).toBe("default")
  })

  test("prefers a child mode over the parent mode", () => {
    const modes: PermissionModes = { [key("root")]: "default", [key("child")]: "bypassPermissions" }
    expect(permissionMode(modes, family, { sessionID: "child" }, directory)).toBe("bypassPermissions")
  })

  test("falls back to the directory mode", () => {
    const modes: PermissionModes = { [key("*")]: "acceptEdits" }
    expect(permissionMode(modes, family, { sessionID: "root" }, directory)).toBe("acceptEdits")
    expect(sessionPermissionMode(modes, family, { sessionID: "root" }, directory)).toBeUndefined()
  })

  test("an explicit manual session overrides the directory mode, also for children", () => {
    const modes: PermissionModes = { [key("*")]: "bypassPermissions", [key("root")]: "default" }
    expect(permissionMode(modes, family, { sessionID: "root" }, directory)).toBe("default")
    expect(permissionMode(modes, family, { sessionID: "child" }, directory)).toBe("default")
  })
})

describe("directoryPermissionMode", () => {
  test("returns the stored mode or manual", () => {
    expect(directoryPermissionMode({ [key("*")]: "plan" }, directory)).toBe("plan")
    expect(directoryPermissionMode({}, directory)).toBe("default")
  })
})

describe("autoRespondsPermission", () => {
  const responds = (mode: PermissionModes[string], permission: string, patterns: string[] = []) =>
    autoRespondsPermission({ [key("root")]: mode }, family, request("child", permission, patterns), directory)

  test("manual and plan approve nothing", () => {
    expect(responds("default", "edit")).toBe(false)
    expect(responds("plan", "read")).toBe(false)
  })

  test("accept edits approves file tools but not shell commands", () => {
    expect(responds("acceptEdits", "edit")).toBe(true)
    expect(responds("acceptEdits", "read")).toBe(true)
    expect(responds("acceptEdits", "bash", ["ls"])).toBe(false)
  })

  test("auto additionally approves known-safe shell commands only", () => {
    expect(responds("auto", "edit")).toBe(true)
    expect(responds("auto", "bash", ["git status", "ls -la"])).toBe(true)
    expect(responds("auto", "bash", ["git status", "rm -rf build"])).toBe(false)
    expect(responds("auto", "webfetch")).toBe(false)
  })

  test("bypass approves everything", () => {
    expect(responds("bypassPermissions", "bash", ["rm -rf build"])).toBe(true)
    expect(responds("bypassPermissions", "webfetch")).toBe(true)
  })

  test("without a session mode the directory mode decides", () => {
    expect(autoRespondsPermission({ [key("*")]: "acceptEdits" }, family, request("other", "edit"), directory)).toBe(
      true,
    )
    expect(autoRespondsPermission({ [key("*")]: "acceptEdits" }, family, request("other"), directory)).toBe(false)
    expect(autoRespondsPermission({}, family, request("other", "edit"), directory)).toBe(false)
  })
})

describe("migratePermissionModes", () => {
  test("maps the old approve-everything toggle onto bypass permissions and keeps explicit off as manual", () => {
    expect(migratePermissionModes({ autoAccept: { [key("root")]: true, [key("*")]: false, legacy: true } })).toEqual({
      mode: { [key("root")]: "bypassPermissions", [key("*")]: "default", legacy: "bypassPermissions" },
    })
  })

  test("reads the older autoAcceptEdits field", () => {
    expect(migratePermissionModes({ autoAcceptEdits: { root: true } })).toEqual({ mode: { root: "bypassPermissions" } })
  })

  test("drops values that are not booleans and handles missing data", () => {
    expect(migratePermissionModes({ autoAccept: { root: "yes" } })).toEqual({ mode: {} })
    expect(migratePermissionModes({})).toEqual({ mode: {} })
    expect(migratePermissionModes(undefined)).toBeUndefined()
  })

  test("leaves already migrated data untouched", () => {
    const value = { mode: { root: "auto" } }
    expect(migratePermissionModes(value)).toBe(value)
  })
})
