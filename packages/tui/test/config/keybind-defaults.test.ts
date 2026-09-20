import { describe, expect, test } from "bun:test"
import { TuiKeybind } from "../../src/config/keybind"

// Tab is reserved for autocomplete so the prompt behaves like Claude Code; agent cycling lives on another key.
describe("default keybinds", () => {
  test("tab completes autocomplete and never cycles agents", () => {
    expect(TuiKeybind.defaultValue("prompt.autocomplete.complete")).toBe("tab")
    expect(TuiKeybind.defaultValue("agent_cycle")).not.toBe("tab")
    expect(TuiKeybind.defaultValue("agent_cycle_reverse")).not.toContain("tab")
  })
  test("shift+tab cycles permission mode", () => {
    expect(TuiKeybind.defaultValue("permission_mode_cycle")).toBe("shift+tab")
  })
})
