import fuzzysort from "fuzzysort"
import { useCommand } from "@/context/command"
import { useLanguage } from "@/context/language"
import type { ModelSelection } from "@/context/local"
import { useSync } from "@/context/sync"
import { showToast } from "@/utils/toast"
import { PERMISSION_MODE_ALIASES, usePermissionMode } from "./permission-mode"

/**
 * Runs client-side slash commands that were submitted as text, e.g. `/clear` typed past the popover or
 * `/permissions auto`. Returns true when the text was handled so the caller never sends it to the model.
 */
export function useSlashCommandRunner(input: { model: () => ModelSelection }) {
  const command = useCommand()
  const language = useLanguage()
  const sync = useSync()
  const permissionMode = usePermissionMode()

  const fail = (title: string, description?: string) => {
    showToast({ variant: "error", title, description })
    return true
  }

  return (text: string) => {
    const match = text.match(/^\/([\w.-]+)(?:\s+(.+))?$/s)
    if (!match || sync().data.command.some((item) => item.name === match[1])) return false
    const name = match[1].toLowerCase()
    const arg = match[2]?.trim().toLowerCase()
    const named = (item: { slash?: string; slashAliases?: string[] }) =>
      item.slash === name || !!item.slashAliases?.includes(name)

    if (arg && (name === "permissions" || name === "mode")) {
      const mode = PERMISSION_MODE_ALIASES[arg]
      if (!mode) return fail(language.t("toast.permissions.mode.unknown", { mode: arg }))
      permissionMode.set(mode)
      showToast({ title: language.t("toast.permissions.mode.title", { mode: permissionMode.label(mode) }) })
      return true
    }

    if (arg && (name === "effort" || name === "variants")) {
      const variant = input.model().variant
      const level = variant.list().find((item) => item.toLowerCase() === arg)
      if (!level && arg !== "default" && arg !== "auto")
        return fail(
          language.t("toast.model.variant.unknown", { effort: arg }),
          variant.list().length
            ? ["default", ...variant.list()].join(", ")
            : language.t("toast.model.variant.unsupported"),
        )
      variant.set(level)
      return true
    }

    if (arg && (name === "model" || name === "models")) {
      // Exact `provider/model` or model id first, then the best fuzzy match on id and display name.
      const models = input
        .model()
        .list()
        .map((model) => ({
          providerID: model.provider.id,
          modelID: model.id,
          key: `${model.provider.id}/${model.id}`.toLowerCase(),
          name: model.name.toLowerCase(),
        }))
      const found =
        models.find((item) => item.key === arg || item.modelID.toLowerCase() === arg) ??
        fuzzysort.go(arg, models, { keys: ["key", "name"], limit: 1 })[0]?.obj
      if (!found) return fail(language.t("toast.model.noMatch", { query: arg }))
      input.model().set({ providerID: found.providerID, modelID: found.modelID }, { recent: true })
      showToast({ title: language.t("toast.model.set", { model: `${found.providerID}/${found.modelID}` }) })
      return true
    }

    const option = command.options.find((item) => !item.id.startsWith("suggested.") && named(item))
    if (option && !option.disabled) {
      command.trigger(option.id, "slash")
      return true
    }
    // Known on another page (the catalog remembers every command seen) or disabled here: swallow it, never send it.
    if (option || command.catalog.some(named)) return fail(language.t("toast.slash.unavailable", { command: name }))
    return false
  }
}
