# Contributing to Kiwii

Thanks for helping! Kiwii is a fork of OpenCode (MIT); see `UPSTREAM.md` for what changed.

## Setup

```sh
bun install          # Bun 1.3.14 (see packageManager in package.json)
bun typecheck        # all packages
bun dev              # run the CLI from source
```

Run tests inside a package, never from the root: `cd packages/kiwii && bun test`.

## Pull requests

- Branch from `main`, keep PRs focused, and use conventional commit titles (`feat(tui): ...`, `fix(core): ...`).
- Add or update tests next to the code you touch (`packages/<pkg>/test`).
- Regenerate the SDK and `schema/` when config schemas change (see `KIWII.md`).
- CI runs typecheck and the per-package test suites; make sure they pass locally first.

## Style

Follow `AGENTS.md`: Effect generators, Bun APIs, no star imports or import aliases, minimal helpers, `const` over `let`.
