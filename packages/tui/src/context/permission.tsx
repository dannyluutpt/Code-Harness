import { createStore } from "solid-js/store"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"
import type { Theme } from "../theme"
import { useArgs } from "./args"
import { createSimpleContext } from "./helper"

/** Claude Code compatible permission modes. */
export type PermissionMode = ConfigPermissionV1.Mode

export const PERMISSION_MODES = ConfigPermissionV1.MODES

/** Modes always reachable with the cycle key. bypassPermissions joins only once it was requested explicitly (flag, config or palette). */
export const CYCLE_MODES: PermissionMode[] = ["default", "acceptEdits", "plan", "auto"]

export const EDIT_PERMISSIONS = ConfigPermissionV1.EDIT_PERMISSIONS

export const isPermissionMode = ConfigPermissionV1.isMode

export const autoApprove = ConfigPermissionV1.autoApprove

/** Names accepted by `/permissions <mode>`. */
export const PERMISSION_MODE_ALIASES: Record<string, PermissionMode> = {
  default: "default",
  manual: "default",
  ask: "default",
  acceptedits: "acceptEdits",
  "accept-edits": "acceptEdits",
  edits: "acceptEdits",
  plan: "plan",
  auto: "auto",
  bypass: "bypassPermissions",
  bypasspermissions: "bypassPermissions",
  "bypass-permissions": "bypassPermissions",
}

export function permissionModeLabel(mode: PermissionMode) {
  switch (mode) {
    case "acceptEdits":
      return "accept edits"
    case "plan":
      return "plan"
    case "auto":
      return "auto"
    case "bypassPermissions":
      return "bypass permissions"
    default:
      return "manual"
  }
}

/** Accent for the prompt box: the mode is readable from the border alone. */
export function permissionModeColor(mode: PermissionMode, theme: Theme) {
  switch (mode) {
    case "bypassPermissions":
      return theme.permissionBypass
    case "auto":
      return theme.permissionAuto
    case "acceptEdits":
      return theme.permissionAcceptEdits
    case "plan":
      return theme.permissionPlan
    default:
      return theme.permissionDefault
  }
}

export function nextPermissionMode(mode: PermissionMode, bypass: boolean) {
  const modes = bypass ? [...CYCLE_MODES, "bypassPermissions" as const] : CYCLE_MODES
  return modes[(modes.indexOf(mode) + 1) % modes.length]!
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
    const [store, setStore] = createStore({ mode: initial, bypass: initial === "bypassPermissions" })
    return {
      get mode() {
        return store.mode
      },
      set(mode: PermissionMode) {
        setStore({ mode, bypass: store.bypass || mode === "bypassPermissions" })
      },
      /** Cycle manual → accept edits → plan → auto (→ bypass permissions when it was enabled) → manual. */
      cycle() {
        setStore("mode", (mode) => nextPermissionMode(mode, store.bypass))
      },
    }
  },
})
