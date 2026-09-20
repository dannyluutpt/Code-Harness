import { useNavigate } from "@solidjs/router"
import { openPermissionModeMenu, usePermissionMode } from "@/components/prompt-input/permission-mode"
import { openSessionContext } from "@/components/session-context-usage"
import { useSettingsDialog } from "@/components/settings-dialog"
import { openStatusPopover } from "@/components/status-popover"
import { useCommand, type CommandOption } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useLayout } from "@/context/layout"
import { useLocal, type ModelSelection } from "@/context/local"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { useSettings } from "@/context/settings"
import { showToast } from "@/utils/toast"
import { useDialog } from "@kiwii/ui/context/dialog"
import { getCursorPosition, setCursorPosition } from "@/components/prompt-input/editor-dom"
import { useSessionLayout } from "./session-layout"
import { createSessionOwnership } from "./session-ownership"

const withCategory = (category: string) => {
  return (option: Omit<CommandOption, "category">): CommandOption => ({
    ...option,
    category,
  })
}

export const useComposerCommands = (input: { model?: ModelSelection } = {}) => {
  const command = useCommand()
  const dialog = useDialog()
  const language = useLanguage()
  const local = useLocal()
  const navigate = useNavigate()
  const layout = useLayout()
  const platform = usePlatform()
  const sdk = useSDK()
  const settings = useSettings()
  const permissionMode = usePermissionMode()
  const openSettings = useSettingsDialog()
  const { params, sessionKey, tabs, view } = useSessionLayout()
  const sessionOwnership = createSessionOwnership(sessionKey)
  const model = input.model ?? local.model
  const modelCommand = withCategory(language.t("command.category.model"))
  const agentCommand = withCategory(language.t("command.category.agent"))
  const permissionsCommand = withCategory(language.t("command.category.permissions"))
  const viewCommand = withCategory(language.t("command.category.view"))

  const chooseModel = async () => {
    const owner = sessionOwnership.capture()
    const editor = document.querySelector<HTMLElement>('[data-component="prompt-input"]')
    const selection = window.getSelection()
    const cursor =
      editor && selection?.rangeCount && editor.contains(selection.anchorNode) ? getCursorPosition(editor) : null
    const restoreComposer = () => {
      // Kobalte restores focus during its teardown effect; defer past it so the
      // composer keeps focus and the caret returns to where the user left it.
      requestAnimationFrame(() => {
        const editor = document.querySelector<HTMLElement>('[data-component="prompt-input"]')
        if (!editor) return
        editor.focus()
        if (cursor !== null) setCursorPosition(editor, cursor)
      })
    }
    const { DialogSelectModel } = await import("@/components/dialog-select-model")
    owner.run(() => {
      void dialog.show(() => <DialogSelectModel model={model} />, restoreComposer)
    })
  }

  command.register("composer", () => [
    modelCommand({
      id: "model.choose",
      title: language.t("command.model.choose"),
      description: language.t("command.model.choose.description"),
      keybind: "mod+'",
      slash: "model",
      slashAliases: ["models"],
      onSelect: chooseModel,
    }),
    modelCommand({
      id: "model.variant.cycle",
      title: language.t("command.model.variant.cycle"),
      description: language.t("command.model.variant.cycle.description"),
      keybind: "shift+mod+d",
      slash: "effort",
      slashAliases: ["variants"],
      onSelect: () => model.variant.cycle(),
    }),
    agentCommand({
      id: "agent.cycle",
      title: language.t("command.agent.cycle"),
      description: language.t("command.agent.cycle.description"),
      keybind: "mod+.",
      slash: "agent",
      slashAliases: ["agents"],
      disabled: !local.agent.visible(),
      onSelect: () => local.agent.move(1),
    }),
    agentCommand({
      id: "agent.cycle.reverse",
      title: language.t("command.agent.cycle.reverse"),
      description: language.t("command.agent.cycle.reverse.description"),
      keybind: "shift+mod+.",
      disabled: !local.agent.visible(),
      onSelect: () => local.agent.move(-1),
    }),
    permissionsCommand({
      id: "permissions.mode",
      title: language.t("command.permissions.mode"),
      description: language.t("command.permissions.mode.description"),
      slash: "permissions",
      slashAliases: ["mode"],
      onSelect: openPermissionModeMenu,
    }),
    // The old boolean toggle approved every request, which is what bypass permissions does now.
    permissionsCommand({
      id: "permissions.autoaccept",
      title:
        permissionMode.current() === "bypassPermissions"
          ? language.t("command.permissions.autoaccept.disable")
          : language.t("command.permissions.autoaccept.enable"),
      keybind: "mod+shift+a",
      onSelect: () => {
        const active = permissionMode.current() !== "bypassPermissions"
        permissionMode.set(active ? "bypassPermissions" : "default")
        showToast({
          title: active
            ? language.t("toast.permissions.autoaccept.on.title")
            : language.t("toast.permissions.autoaccept.off.title"),
          description: active
            ? language.t("toast.permissions.autoaccept.on.description")
            : language.t("toast.permissions.autoaccept.off.description"),
        })
      },
    }),
    withCategory(language.t("command.category.mcp"))({
      id: "mcp.toggle",
      title: language.t("command.mcp.toggle"),
      description: language.t("command.mcp.toggle.description"),
      keybind: "mod+;",
      slash: "mcp",
      slashAliases: ["mcps"],
      onSelect: async () => {
        const owner = sessionOwnership.capture()
        const { DialogSelectMcp } = await import("@/components/dialog-select-mcp")
        owner.run(() => void dialog.show(() => <DialogSelectMcp />))
      },
    }),
    viewCommand({
      id: "status.open",
      title: language.t("status.popover.trigger"),
      description: language.t("command.status.open.description"),
      slash: "status",
      slashAliases: ["cost", "usage", "context"],
      onSelect: () => {
        if (!params.id) return openStatusPopover()
        openSessionContext({ view: view(), layout, tabs: tabs() })
      },
    }),
    viewCommand({
      id: "session.browse",
      title: language.t("command.session.browse"),
      description: language.t("command.session.browse.description"),
      slash: "resume",
      slashAliases: ["sessions", "continue"],
      onSelect: () => navigate("/"),
    }),
    withCategory(language.t("command.category.theme"))({
      id: "theme.choose",
      title: language.t("settings.general.row.theme.title"),
      description: language.t("command.theme.choose.description"),
      slash: "theme",
      slashAliases: ["themes"],
      onSelect: openSettings,
    }),
    viewCommand({
      id: "help.open",
      title: language.t("sidebar.help"),
      slash: "help",
      onSelect: () => platform.openExternal("https://github.com/dannyluutpt/Code-Harness"),
    }),
    // The legacy layout registers provider.connect itself; the new shell has no global registration.
    ...(settings.general.newLayoutDesigns()
      ? [
          withCategory(language.t("command.category.provider"))({
            id: "provider.connect",
            title: language.t("command.provider.connect"),
            slash: "login",
            slashAliases: ["connect", "providers"],
            onSelect: async () => {
              const owner = sessionOwnership.capture()
              const { DialogConnectProvider } = await import("@/components/dialog-connect-provider")
              owner.run(() => void dialog.show(() => <DialogConnectProvider directory={() => sdk().directory} />))
            },
          }),
        ]
      : []),
  ])
}
