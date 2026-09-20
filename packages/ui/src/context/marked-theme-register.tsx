import { registerCustomTheme } from "@pierre/diffs"
import { KiwiiTheme } from "./marked-theme"

let registered = false

export function registerKiwiiTheme() {
  if (registered) return
  registered = true
  registerCustomTheme("Kiwii", () => Promise.resolve(KiwiiTheme))
}
