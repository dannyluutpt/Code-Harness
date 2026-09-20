import { useLocal } from "../context/local"
import { PERMISSION_MODES, permissionModeLabel, type PermissionMode } from "../context/permission"
import { useKiwiiKeymap } from "../keymap"
import { DialogSelect } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"

const DESCRIPTIONS: Record<PermissionMode, string> = {
  default: "ask before edits and commands",
  acceptEdits: "edit files freely, ask for commands",
  plan: "read-only planning",
  auto: "approve edits and known-safe commands, ask for the rest",
  bypassPermissions: "approve everything not explicitly denied",
}

export function DialogPermission() {
  const local = useLocal()
  const dialog = useDialog()
  const keymap = useKiwiiKeymap()

  return (
    <DialogSelect<PermissionMode>
      options={PERMISSION_MODES.map((mode) => ({
        value: mode,
        title: permissionModeLabel(mode),
        description: DESCRIPTIONS[mode],
        onSelect: () => {
          dialog.clear()
          // The per-mode commands also keep the plan agent in sync.
          keymap.dispatchCommand(`permission.mode.${mode}`)
        },
      }))}
      title={"Permission mode"}
      current={local.permission.mode}
      flat={true}
    />
  )
}
