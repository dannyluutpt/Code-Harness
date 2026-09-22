import { describe, expect, test } from "bun:test"
import path from "node:path"
import { RESET } from "../../src/util/terminal-reset"

describe("terminal reset", () => {
  test("turns off every mouse reporting mode", () => {
    for (const mode of ["1000", "1002", "1003", "1006", "1015", "1016"]) {
      expect(RESET).toContain(`\x1b[?${mode}l`)
    }
  })

  test("releases the keyboard protocols and shows the cursor", () => {
    expect(RESET).toContain("\x1b[<u")
    expect(RESET).toContain("\x1b[>4;0m")
    expect(RESET).toContain("\x1b[?2004l")
    expect(RESET).toContain("\x1b[?25h")
  })

  test("disables any-event tracking before the plain mouse modes", () => {
    expect(RESET.indexOf("\x1b[?1003l")).toBeLessThan(RESET.indexOf("\x1b[?1000l"))
  })

  // The point of the handler is the hard-exit path, so drive a real process through it.
  test("writes the reset when the process exits without tearing down", async () => {
    const module = path.join(import.meta.dir, "..", "..", "src", "util", "terminal-reset.ts")
    const proc = Bun.spawn(
      [
        "bun",
        "-e",
        `const { installTerminalReset } = await import(${JSON.stringify(module)}); installTerminalReset(); process.exit(0)`,
      ],
      { stdout: "pipe", stderr: "pipe" },
    )
    const [stdout, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited])
    expect(code).toBe(0)
    expect(stdout).toBe(RESET)
  })
})
