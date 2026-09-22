import { describe, expect, test } from "bun:test"
import path from "node:path"
import { RESET } from "../../src/util/terminal-reset"

const module = path.join(import.meta.dir, "..", "..", "src", "util", "terminal-reset.ts")

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

  // SIGTERM with no listener never reaches an "exit" handler, so this path only works if the signal
  // itself is handled. The process must still die from it rather than hang on our listener.
  test("writes the reset and still dies when SIGTERM arrives", async () => {
    const proc = Bun.spawn(
      [
        "bun",
        "-e",
        `const { installTerminalReset } = await import(${JSON.stringify(module)}); installTerminalReset(); setInterval(() => {}, 1000)`,
      ],
      { stdout: "pipe", stderr: "pipe" },
    )
    await Bun.sleep(500)
    proc.kill("SIGTERM")
    const [stdout] = await Promise.all([new Response(proc.stdout).text(), proc.exited])
    expect(proc.signalCode).toBe("SIGTERM")
    expect(stdout).toBe(RESET)
  })

  // Another listener owns both the shutdown and the terminal: Ctrl-c that only clears a draft leaves
  // the session running, and resetting underneath it would drop the modes the session still needs.
  test("leaves the signal to another listener when one is registered", async () => {
    const proc = Bun.spawn(
      [
        "bun",
        "-e",
        `const { installTerminalReset } = await import(${JSON.stringify(module)}); installTerminalReset(); process.on("SIGTERM", () => { process.stdout.write("handled"); process.exit(7) }); setInterval(() => {}, 1000)`,
      ],
      { stdout: "pipe", stderr: "pipe" },
    )
    await Bun.sleep(500)
    proc.kill("SIGTERM")
    const [stdout, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited])
    expect(code).toBe(7)
    expect(stdout).toBe("handled" + RESET)
  })
})
