import { describe, expect, test } from "bun:test"
import path from "node:path"

// Every key a user can write in kiwii.json. From 1.0.0 the config is frozen: adding a key is a minor
// release and updating this list is the whole ceremony, but removing or renaming one breaks every
// config that used it, so it waits for a major. A failure here is that decision asking to be made,
// not a list that needs quieting.
const KEYS = [
  "$schema",
  "agent",
  "attachment",
  "autoshare",
  "autoupdate",
  "command",
  "compaction",
  "default_agent",
  "disabled_providers",
  "enabled_providers",
  "enterprise",
  "experimental",
  "formatter",
  "hooks",
  "instructions",
  "layout",
  "logLevel",
  "lsp",
  "mcp",
  "memory",
  "mode",
  "model",
  "permission",
  "permission_mode",
  "permissions",
  "plugin",
  "provider",
  "reference",
  "references",
  "server",
  "share",
  "shell",
  "skills",
  "small_model",
  "snapshot",
  "subagent_depth",
  "tool_output",
  "tools",
  "username",
  "watcher",
  "websearch",
]

const schema = await Bun.file(path.join(import.meta.dir, "..", "..", "..", "..", "schema", "config.json")).json()

describe("config schema", () => {
  test("declares exactly the frozen set of top-level keys", () => {
    expect(Object.keys(schema.$defs.Config.properties).sort()).toEqual(KEYS)
  })

  test("keeps the permission modes the CLI and the web UI both switch between", () => {
    expect(schema.$defs.PermissionMode.enum).toEqual(["default", "acceptEdits", "plan", "auto", "bypassPermissions"])
  })
})
