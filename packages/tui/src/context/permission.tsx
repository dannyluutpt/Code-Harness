import { createStore } from "solid-js/store"
import { useArgs } from "./args"
import { createSimpleContext } from "./helper"

/** Claude Code compatible permission modes. */
export type PermissionMode = "default" | "acceptEdits" | "plan" | "bypassPermissions"

export const PERMISSION_MODES: PermissionMode[] = ["default", "acceptEdits", "plan", "bypassPermissions"]

/** Modes reachable with the cycle key. bypassPermissions must be requested explicitly (flag, config or palette). */
export const CYCLE_MODES: PermissionMode[] = ["default", "acceptEdits", "plan"]

/** Permissions auto-approved in acceptEdits mode. */
export const EDIT_PERMISSIONS = new Set(["edit", "write", "apply_patch", "read", "glob", "grep", "list"])

export function isPermissionMode(value: unknown): value is PermissionMode {
  return typeof value === "string" && (PERMISSION_MODES as string[]).includes(value)
}

export function permissionModeLabel(mode: PermissionMode) {
  switch (mode) {
    case "acceptEdits":
      return "accept edits"
    case "plan":
      return "plan"
    case "bypassPermissions":
      return "bypass permissions"
    default:
      return "default"
  }
}

/** Whether a permission request should be auto-approved under the given mode. */
export function autoApprove(mode: PermissionMode, permission: string) {
  if (mode === "bypassPermissions") return true
  if (mode === "acceptEdits") return EDIT_PERMISSIONS.has(permission)
  return false
}

export const { use: usePermission, provider: PermissionProvider } = createSimpleContext({
  name: "Permission",
  init: () => {
    const args = useArgs()
    const initial: PermissionMode = isPermissionMode(args.permissionMode)
      ? args.permissionMode
      : args.auto
        ? "bypassPermissions"
        : "default"
    const [store, setStore] = createStore<{ mode: PermissionMode }>({ mode: initial })
    return {
      get mode() {
        return store.mode
      },
      set(mode: PermissionMode) {
        setStore("mode", mode)
      },
      /** Cycle default → acceptEdits → plan → default (bypassPermissions returns to default). */
      cycle() {
        setStore("mode", (mode) => {
          const index = CYCLE_MODES.indexOf(mode)
          if (index === -1) return "default"
          return CYCLE_MODES[(index + 1) % CYCLE_MODES.length]!
        })
      },
      /** @deprecated use cycle(); kept for plugins toggling auto-approve. */
      toggle() {
        setStore("mode", (mode) => (mode === "bypassPermissions" ? "default" : "bypassPermissions"))
      },
    }
  },
})
