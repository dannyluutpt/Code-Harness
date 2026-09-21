import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"
import { ButtonV2 } from "@kiwii/ui/v2/button-v2"
import { Icon } from "@kiwii/ui/v2/icon"
import { KeybindV2 } from "@kiwii/ui/v2/keybind-v2"
import { MenuV2 } from "@kiwii/ui/v2/menu-v2"
import { TooltipV2 } from "@kiwii/ui/v2/tooltip-v2"
import { useParams } from "@solidjs/router"
import { For } from "solid-js"
import { createStore } from "solid-js/store"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useLocal } from "@/context/local"
import { usePermission } from "@/context/permission"
import { useSDK } from "@/context/sdk"

const LABELS = {
  default: "permission.mode.default",
  acceptEdits: "permission.mode.acceptEdits",
  plan: "permission.mode.plan",
  auto: "permission.mode.auto",
  bypassPermissions: "permission.mode.bypassPermissions",
} as const

const DESCRIPTIONS = {
  default: "permission.mode.default.description",
  acceptEdits: "permission.mode.acceptEdits.description",
  plan: "permission.mode.plan.description",
  auto: "permission.mode.auto.description",
  bypassPermissions: "permission.mode.bypassPermissions.description",
} as const

/** Names accepted by `/permissions <mode>`, matching the TUI. */
export const PERMISSION_MODE_ALIASES: Record<string, ConfigPermissionV1.Mode> = {
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

// The menu lives in the composer while `/permissions` is a command, so the open state is shared at module level.
const [menu, setMenu] = createStore({ open: false })

// Selecting a slash command hands focus back to the editor on the next frame, and a non-modal menu closes when
// focus lands outside it, so open only after that focus has settled.
export const openPermissionModeMenu = () => requestAnimationFrame(() => setTimeout(() => setMenu("open", true)))

/** The permission mode of the routed session, or of the directory while the session does not exist yet. */
export function usePermissionMode() {
  const params = useParams<{ id?: string }>()
  const sdk = useSDK()
  const local = useLocal()
  const language = useLanguage()
  const permission = usePermission()
  const current = () => permission.mode(params.id, sdk().directory)

  return {
    current,
    label: (mode: ConfigPermissionV1.Mode) => language.t(LABELS[mode]),
    set(next: ConfigPermissionV1.Mode) {
      const previous = current()
      permission.setMode(params.id, sdk().directory, next)
      // Plan mode maps onto the built-in read-only `plan` agent; leaving it returns to `build`.
      if (previous === next) return
      if (next === "plan") return local.agent.set("plan")
      if (previous === "plan" && local.agent.current()?.name === "plan") local.agent.set("build")
    },
  }
}

export function PromptPermissionModeControl(props: { onClose: () => void }) {
  const command = useCommand()
  const language = useLanguage()
  const mode = usePermissionMode()

  return (
    <TooltipV2
      placement="top"
      value={
        <>
          {language.t("permission.mode.title")}
          <KeybindV2 keys={command.keybindParts("permissions.mode")} variant="neutral" />
        </>
      }
    >
      <MenuV2
        gutter={6}
        modal={false}
        placement="top-start"
        open={menu.open}
        onOpenChange={(open) => {
          setMenu("open", open)
          if (!open) props.onClose()
        }}
      >
        <MenuV2.Trigger
          as={ButtonV2}
          variant="ghost-muted"
          size="normal"
          class="max-w-[220px] justify-start ![font-weight:440]"
          classList={{ "!text-[var(--v2-state-fg-warning)]": mode.current() === "bypassPermissions" }}
          aria-label={language.t("permission.mode.title")}
          data-action="prompt-permission-mode"
        >
          <span class="truncate leading-5">{mode.label(mode.current())}</span>
          <span class="-ms-0.5 -me-1 flex shrink-0">
            <Icon name="chevron-down" />
          </span>
        </MenuV2.Trigger>
        <MenuV2.Portal>
          <MenuV2.Content>
            <MenuV2.RadioGroup
              value={mode.current()}
              onChange={(value) => ConfigPermissionV1.isMode(value) && mode.set(value)}
            >
              <For each={ConfigPermissionV1.MODES}>
                {(item) => (
                  <MenuV2.RadioItem value={item} class="!h-auto !py-1.5" closeOnSelect>
                    <span class="flex min-w-0 flex-col gap-1.5">
                      <span classList={{ "text-[var(--v2-state-fg-warning)]": item === "bypassPermissions" }}>
                        {mode.label(item)}
                      </span>
                      <span class="text-[12px] text-v2-text-text-faint">{language.t(DESCRIPTIONS[item])}</span>
                    </span>
                  </MenuV2.RadioItem>
                )}
              </For>
            </MenuV2.RadioGroup>
          </MenuV2.Content>
        </MenuV2.Portal>
      </MenuV2>
    </TooltipV2>
  )
}
