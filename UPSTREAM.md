# Upstream provenance / Nguồn gốc mã

Kiwii is a fork of **OpenCode** (https://github.com/sst/opencode, MIT license).

| | |
|---|---|
| Upstream repository | `https://github.com/sst/opencode` (package metadata: `anomalyco/opencode`) |
| Upstream commit | `ebb7b76eca82342642c78645109e865614533827` |
| Upstream commit date | 2026-09-19 |
| Upstream version | 1.18.31 |
| Import method | Snapshot copy, squashed into one commit (no upstream git history) |

## Removed from upstream / Phần đã bỏ khi fork

OpenCode's own cloud/SaaS surface and tooling not needed for a local-first CLI:

- `packages/console/*` (opencode.ai console, Stripe billing), `packages/stats/*`, `packages/enterprise`, `packages/function` (Cloudflare worker for api.opencode.ai), `packages/slack`, `packages/identity`, `packages/containers`
- `packages/desktop` (Electron app), `packages/storybook` and all `*.stories.tsx`
- `packages/cli` (experimental `lildax` binary), `packages/client`, `packages/httpapi-codegen`, `packages/sdk-next`, `packages/effect-sqlite-node`
- `packages/web` (Astro docs site, 20 locales) and `packages/docs` (Mintlify) — replaced by `docs/` Markdown
- `infra/`, `sst.config.ts`, `flake.nix`, `nix/`, `github/` (GitHub Action), `sdks/` (VS Code extension, Python SDK), upstream `.github/` workflows
- Translated READMEs, `STATS.md`, `CONTEXT.md`, `specs/`, `artifacts/`, `perf/`

Hosted-service integrations removed from the CLI:

- `opencode` / `opencode-go` ("Zen") hosted model provider
- `console` command and console-account login
- Hosted session sharing (`opncd.ai`); sharing now requires a self-hosted `enterprise.url`
- `github` command (GitHub App via api.opencode.ai)
- Web UI fallback proxy to `app.opencode.ai` (now proxies a local Vite dev server when no bundle is embedded)

## Comparing with upstream / Đối chiếu với upstream

```sh
git clone https://github.com/sst/opencode.git /tmp/opencode
git -C /tmp/opencode checkout ebb7b76eca82342642c78645109e865614533827
diff -r --exclude=node_modules /tmp/opencode/packages/core packages/core
```
