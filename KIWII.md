# Kiwii repository instructions

This repository is Kiwii itself (a fork of OpenCode, see UPSTREAM.md). Follow AGENTS.md for the style guide.

- `bun install`, `bun typecheck`, tests per package: `bun test` inside `packages/kiwii`, `packages/core`, `packages/tui`, `packages/ui`, `packages/session-ui`. Never run tests from the root.
- The shipping CLI is `packages/kiwii` (v1 code paths). `packages/core` holds shared services and an in-progress v2; do not port features to v2 unless asked.
- After changing config schemas (`packages/core/src/v1/config/*`), regenerate the SDK: `bun run packages/sdk/js/script/build.ts`, and the JSON schema: `bun run --cwd packages/kiwii script/schema.ts ../../schema/config.json ../../schema/tui.json`.
- Help-text and TUI snapshots live in `packages/kiwii/test/cli/help/__snapshots__` and `packages/tui/test/**/__snapshots__`; refresh with `bun test <file> -u` when CLI options change.
- Build a binary with `bun run --cwd packages/kiwii build -- --single`; it embeds the web UI and uses `packages/kiwii/models-snapshot.json` offline.
- Kiwii-specific features: permission modes (`packages/kiwii/src/permission`, `packages/tui/src/context/permission.tsx`), hooks (`packages/kiwii/src/plugin/hooks.ts`), memory (`packages/kiwii/src/session/memory.ts`), websearch providers (`packages/kiwii/src/tool/websearch.ts`), Ollama detection (`packages/kiwii/src/provider/provider.ts`).
