import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerKiwiiSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
