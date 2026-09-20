import { describe, expect, test } from "bun:test"
import { createHooksPlugin, runHooks, runCommand, HookBlockedError } from "../../src/plugin/hooks"
import type { PluginInput } from "@kiwii/plugin"

const fakeInput = (directory: string) =>
  ({ directory, worktree: directory, client: { postSessionIdPermissionsPermissionId: async () => ({}) } }) as unknown as PluginInput

describe("hooks plugin", () => {
  test("exit code 2 blocks PreToolUse with stderr as the reason", async () => {
    const plugin = await createHooksPlugin(fakeInput(process.cwd()), runCommand(process.cwd(), {}))
    await plugin.config!({
      hooks: { PreToolUse: [{ matcher: "bash", hooks: [{ type: "command", command: "echo nope >&2; exit 2" }] }] },
    } as never)
    await expect(
      plugin["tool.execute.before"]!({ tool: "bash", sessionID: "s", callID: "c" }, { args: { command: "rm -rf /" } }),
    ).rejects.toBeInstanceOf(HookBlockedError)
    await expect(
      plugin["tool.execute.before"]!({ tool: "bash", sessionID: "s", callID: "c" }, { args: { command: "ls" } }),
    ).rejects.toThrow("nope")
  })

  test("matcher limits hooks to the named tool and stdin carries the payload", async () => {
    const plugin = await createHooksPlugin(fakeInput(process.cwd()), runCommand(process.cwd(), {}))
    await plugin.config!({
      hooks: {
        PreToolUse: [
          {
            matcher: "edit|write",
            hooks: [{ type: "command", command: `cat | grep -q '"tool_name":"write"' && exit 2; exit 0` }],
          },
        ],
      },
    } as never)
    await plugin["tool.execute.before"]!({ tool: "bash", sessionID: "s", callID: "c" }, { args: {} })
    await plugin["tool.execute.before"]!({ tool: "edit", sessionID: "s", callID: "c" }, { args: {} })
    await expect(
      plugin["tool.execute.before"]!({ tool: "write", sessionID: "s", callID: "c" }, { args: {} }),
    ).rejects.toBeInstanceOf(HookBlockedError)
  })

  test("JSON stdout can update input and add context", async () => {
    const plugin = await createHooksPlugin(fakeInput(process.cwd()), runCommand(process.cwd(), {}))
    await plugin.config!({
      hooks: {
        PreToolUse: [{ hooks: [{ type: "command", command: `echo '{"updatedInput":{"timeout":5}}'` }] }],
        PostToolUse: [{ hooks: [{ type: "command", command: `echo '{"additionalContext":"remember to lint"}'` }] }],
      },
    } as never)
    const args: Record<string, unknown> = { command: "ls" }
    await plugin["tool.execute.before"]!({ tool: "bash", sessionID: "s", callID: "c" }, { args })
    expect(args).toEqual({ command: "ls", timeout: 5 })
    const output = { title: "t", output: "done", metadata: {} }
    await plugin["tool.execute.after"]!({ tool: "bash", sessionID: "s", callID: "c", args }, output)
    expect(output.output).toContain("remember to lint")
  })

  test("runHooks honours timeouts and ignores non-blocking failures", async () => {
    const outcome = await runHooks(
      { Stop: [{ hooks: [{ type: "command", command: "exit 1" }, { type: "command", command: "sleep 5", timeout: 1 }] }] },
      "Stop",
      { cwd: process.cwd() },
      runCommand(process.cwd(), {}),
    )
    expect(outcome.blocked).toBe(false)
  }, 10_000)

  test("PermissionRequest hook can answer permission requests", async () => {
    const replies: unknown[] = []
    const input = {
      directory: process.cwd(),
      worktree: process.cwd(),
      client: { postSessionIdPermissionsPermissionId: async (body: unknown) => void replies.push(body) },
    } as unknown as PluginInput
    const plugin = await createHooksPlugin(input, runCommand(process.cwd(), {}))
    await plugin.config!({
      hooks: { PermissionRequest: [{ hooks: [{ type: "command", command: `echo '{"decision":"allow"}'` }] }] },
    } as never)
    await plugin.event!({
      event: { type: "permission.asked", properties: { id: "req", sessionID: "s", permission: "bash", patterns: ["ls"] } },
    } as never)
    expect(replies).toEqual([{ path: { id: "s", permissionID: "req" }, body: { response: "once" } }])
  })
})
