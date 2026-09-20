# Dòng lệnh / CLI

## Tiếng Việt

| Lệnh | Mô tả |
|---|---|
| `kiwii [thư-mục]` | Mở TUI. Cờ: `--model provider/model`, `--agent`, `--continue`, `--session <id>`, `--prompt "..."`, `--permission-mode <mode>` |
| `kiwii run "yêu cầu"` | Chạy không tương tác. `--format json` in luồng sự kiện JSON, `--continue`/`--session` để tiếp tục, `--file` đính kèm, `--permission-mode` |
| `kiwii serve` | Server HTTP headless (đặt `KIWII_SERVER_PASSWORD`) |
| `kiwii web` | Server + mở Web UI |
| `kiwii auth login` / `kiwii providers list` | Đăng nhập provider, lưu key vào `~/.local/share/kiwii/auth.json` |
| `kiwii models [provider]` | Liệt kê model |
| `kiwii mcp add\|list\|auth` | Quản lý MCP server |
| `kiwii agent create` | Sinh agent tuỳ chỉnh bằng AI |
| `kiwii session list\|delete`, `kiwii export`, `kiwii import` | Quản lý phiên |
| `kiwii pr <số>` | Checkout PR rồi mở phiên |
| `kiwii upgrade`, `kiwii uninstall`, `kiwii stats`, `kiwii debug` | Tiện ích |

**Phím tắt trong TUI:** `Shift+Tab` đổi permission mode, `Tab` đổi agent, `Ctrl+P` bảng lệnh, `Ctrl+X c` nén ngữ cảnh. Slash: `/init`, `/review`, `/commit`, `/pr`, `/compact`, `/sessions`, `/models`, `/agents`, `/mcps`, `/skills`, `/undo`, `/redo`, `/export`, `/help`.

**Alias theo Claude Code:** `/clear` (= `/new`), `/model` (= `/models`), `/mcp` (= `/mcps`), `/rewind` (= `/undo`), `/login` (= `/connect`), `/resume` (= `/sessions`), `/permissions` (đổi mode), `/cost` (= `/status`).

**Biến môi trường hay dùng:** `KIWII_PERMISSION_MODE`, `KIWII_CONFIG`, `KIWII_CONFIG_DIR`, `KIWII_DISABLE_MEMORY`, `KIWII_DISABLE_WEBSEARCH`, `KIWII_DISABLE_OLLAMA`, `KIWII_MODELS_URL`, `KIWII_DISABLE_MODELS_FETCH`, `KIWII_LOG_LEVEL`.

## English

| Command | Purpose |
|---|---|
| `kiwii [dir]` | Open the TUI. Flags: `--model provider/model`, `--agent`, `--continue`, `--session <id>`, `--prompt "..."`, `--permission-mode <mode>` |
| `kiwii run "prompt"` | Headless run. `--format json` streams events as JSON, `--continue`/`--session` resume, `--file` attaches files |
| `kiwii serve` / `kiwii web` | Headless HTTP server / server plus the browser UI |
| `kiwii auth login`, `kiwii providers list` | Provider credentials (`~/.local/share/kiwii/auth.json`) |
| `kiwii models`, `kiwii mcp …`, `kiwii agent create`, `kiwii session …`, `kiwii export`, `kiwii import`, `kiwii pr <n>` | Catalog, MCP, agents, sessions, PR checkout |
| `kiwii upgrade`, `kiwii uninstall`, `kiwii stats`, `kiwii debug` | Utilities |

**TUI keys:** `Shift+Tab` permission mode, `Tab` agent, `Ctrl+P` command palette, `Ctrl+X c` compact. Slash commands: `/init`, `/review`, `/commit`, `/pr`, `/compact`, `/sessions`, `/models`, `/agents`, `/mcps`, `/skills`, `/undo`, `/redo`, `/export`, `/help`. Claude Code aliases: `/clear`, `/model`, `/mcp`, `/rewind`, `/login`, `/resume`, `/permissions`, `/cost`.

**Environment:** `KIWII_PERMISSION_MODE`, `KIWII_CONFIG`, `KIWII_CONFIG_DIR`, `KIWII_DISABLE_MEMORY`, `KIWII_DISABLE_WEBSEARCH`, `KIWII_DISABLE_OLLAMA`, `KIWII_MODELS_URL`, `KIWII_DISABLE_MODELS_FETCH`, `KIWII_LOG_LEVEL`.
