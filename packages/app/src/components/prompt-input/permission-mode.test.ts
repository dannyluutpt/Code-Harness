import { describe, expect, test } from "bun:test"
import path from "node:path"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"
import { MODE_ACCENTS } from "./permission-mode"

// The accents are CSS variables, so a name that no theme defines renders as no colour at all rather
// than failing anywhere. Read the token sheet and check each one is really there.
const theme = await Bun.file(
  path.join(import.meta.dir, "..", "..", "..", "..", "ui", "src", "v2", "styles", "theme.css"),
).text()

describe("permission mode accents", () => {
  test("covers every mode", () => {
    expect(Object.keys(MODE_ACCENTS).sort()).toEqual([...ConfigPermissionV1.MODES].sort())
  })

  test("gives each mode its own colour", () => {
    expect(new Set(Object.values(MODE_ACCENTS)).size).toBe(ConfigPermissionV1.MODES.length)
  })

  test("only names variables the theme defines", () => {
    for (const accent of Object.values(MODE_ACCENTS)) {
      const variable = accent.slice("var(".length, -1)
      expect(theme).toContain(`${variable}:`)
    }
  })
})
