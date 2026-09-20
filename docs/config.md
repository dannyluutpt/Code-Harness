# Cấu hình / Configuration

## Tiếng Việt

Kiwii đọc và gộp cấu hình theo thứ tự (sau ghi đè trước):

1. Toàn cục: `~/.config/kiwii/kiwii.json` (hoặc `.jsonc`), và `~/.kiwii/`
2. `KIWII_CONFIG=/duong/dan/kiwii.json`
3. Dự án: `kiwii.json` từ thư mục hiện tại đi lên tới gốc repo
4. Thư mục `.kiwii/` trong dự án (`kiwii.jsonc`, `agent/`, `command/`, `skill/`, `plugin/`, `tool/`, `themes/`, `memory/`)
5. `KIWII_CONFIG_DIR`

**Tương thích Claude Code:** Kiwii cũng đọc `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json` (lấy `permissions`, `hooks`, `env`) ở mức ưu tiên thấp nhất, cùng `.claude/commands/*.md`, `.claude/agents/*.md`, `.claude/skills/` và `CLAUDE.md`. Tắt bằng `KIWII_DISABLE_CLAUDE_CODE=1`.

Schema để editor gợi ý: `"$schema": "https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/schema/config.json"`.

Các khoá chính:

```jsonc
{
  "model": "anthropic/claude-sonnet-5",      // model mặc định
  "small_model": "anthropic/claude-haiku-4-5", // cho tiêu đề, tóm tắt, trích xuất bộ nhớ
  "permission_mode": "default",             // default | acceptEdits | plan | bypassPermissions
  "permission": { "bash": { "git *": "allow" } },   // ruleset gốc (sau thắng trước)
  "permissions": { "allow": ["Bash(git *)"], "deny": ["Read(.env)"] }, // cú pháp Claude Code
  "hooks": { /* xem hooks.md */ },
  "memory": { "auto": true, "max_lines": 200 },
  "websearch": { "provider": "tavily", "api_key": "..." },
  "instructions": ["docs/CONVENTIONS.md"],  // file/glob/URL nạp thêm vào system prompt
  "agent": { "reviewer": { "description": "...", "mode": "subagent", "prompt": "..." } },
  "command": { "deploy": { "template": "Deploy $ARGUMENTS", "description": "..." } },
  "mcp": { "fs": { "type": "local", "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."] } },
  "provider": { "myapi": { "npm": "@ai-sdk/openai-compatible", "options": { "baseURL": "https://..." }, "models": { "m1": {} } } },
  "compaction": { "auto": true },
  "share": "disabled"
}
```

## English

Configuration is merged in this order (later wins): global `~/.config/kiwii/kiwii.json` and `~/.kiwii/`, `KIWII_CONFIG`, project `kiwii.json` files walking up to the repo root, the project `.kiwii/` directory (`kiwii.jsonc`, `agent/`, `command/`, `skill/`, `plugin/`, `tool/`, `themes/`, `memory/`), then `KIWII_CONFIG_DIR`.

**Claude Code compatibility:** Kiwii also imports `permissions`, `hooks` and `env` from `~/.claude/settings.json`, `.claude/settings.json` and `.claude/settings.local.json` at the lowest priority, plus `.claude/commands/*.md`, `.claude/agents/*.md`, `.claude/skills/` and `CLAUDE.md`. Disable with `KIWII_DISABLE_CLAUDE_CODE=1`.

Point your editor at the schema: `"$schema": "https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/schema/config.json"`. The main keys are shown in the snippet above: `model`, `small_model`, `permission_mode`, `permission` (native ruleset, later rules win), `permissions` (Claude Code lists), `hooks`, `memory`, `websearch`, `instructions`, `agent`, `command`, `mcp`, `provider`, `compaction`.
