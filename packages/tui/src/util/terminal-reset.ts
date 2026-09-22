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

// SIGHUP is left out: the terminal is going away with the process, and the app already answers it by
// destroying the renderer, which tears down cleanly. These two are the ones the terminal outlives.
const SIGNALS = ["SIGINT", "SIGTERM"] as const

let installed = false

/**
 * Last-resort terminal reset. Runs on process exit, which also covers `process.exit()` and an
 * uncaught error, so the modes are off even when the renderer never got to tear itself down.
 */
export function installTerminalReset(write: (text: string) => void = defaultWrite) {
  if (installed) return () => {}
  installed = true
  const reset = () => write(RESET)
  // A signal nothing else listens for kills the process outright, without running "exit" handlers, so
  // reset here and then re-raise it to keep that default. Any other listener owns both the shutdown
  // and the terminal — Ctrl-c clearing a draft leaves the session running — so then we stay out of it.
  const handlers = SIGNALS.map((signal) => {
    const handler = () => {
      if (process.listenerCount(signal) > 1) return
      reset()
      process.off(signal, handler)
      process.kill(process.pid, signal)
    }
    process.on(signal, handler)
    return { signal, handler }
  })
  process.on("exit", reset)
  return () => {
    handlers.forEach((entry) => process.off(entry.signal, entry.handler))
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
