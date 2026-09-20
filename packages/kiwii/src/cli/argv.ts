/** Claude Code parity: `kiwii -p "prompt"` (print mode) behaves like `kiwii run "prompt"`. */
export function normalizeArgv(argv: string[]) {
  if (argv[0] === "-p" || argv[0] === "--print") return ["run", ...argv.slice(1)]
  return argv
}
