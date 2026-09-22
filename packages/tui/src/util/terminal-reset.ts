import { writeSync } from "node:fs"

// Putting the terminal back the way we found it. The renderer already does this on a clean teardown,
// but a hard exit skips that: process.exit, an uncaught error or a killed shell all leave the terminal
// still reporting mouse motion and key events, and the shell then prints those reports as garbage at
// its prompt. Turning a mode off that was never on is a no-op, so this is safe to send unconditionally.
const SEQUENCES = [
  "\x1b[?1003l", // any-event mouse tracking
  "\x1b[?1002l", // button-event mouse tracking
  "\x1b[?1000l", // X11 mouse reporting
  "\x1b[?1006l", // SGR mouse coordinates
  "\x1b[?1015l", // urxvt mouse coordinates
  "\x1b[?1016l", // SGR pixel mouse coordinates
  "\x1b[<u", // pop the kitty keyboard flags we pushed
  "\x1b[>4;0m", // modifyOtherKeys
  "\x1b[?2004l", // bracketed paste
  "\x1b[?25h", // cursor back on
]

export const RESET = SEQUENCES.join("")

let installed = false

/**
 * Last-resort terminal reset. Runs on process exit, which also covers `process.exit()` and an
 * uncaught error, so the modes are off even when the renderer never got to tear itself down.
 */
export function installTerminalReset(write: (text: string) => void = defaultWrite) {
  if (installed) return () => {}
  installed = true
  const reset = () => write(RESET)
  process.on("exit", reset)
  return () => {
    process.off("exit", reset)
    installed = false
  }
}

function defaultWrite(text: string) {
  // An exit handler cannot await, and the process may be gone by the next tick.
  try {
    writeSync(process.stdout.fd, text)
  } catch {}
}
