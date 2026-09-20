# KIWII.md và bộ nhớ / KIWII.md and memory

## Tiếng Việt

### File hướng dẫn dự án

Kiwii nạp vào system prompt, theo thứ tự ưu tiên, file đầu tiên tìm thấy trong mỗi nhóm:

- Toàn cục: `~/.config/kiwii/KIWII.md`, `~/.kiwii/KIWII.md`, `~/.config/kiwii/AGENTS.md`, `~/.claude/CLAUDE.md`
- Dự án (đi từ thư mục hiện tại lên gốc repo): `KIWII.md`, `AGENTS.md`, `CLAUDE.md`
- Thư mục con: khi model đọc một file, `KIWII.md`/`AGENTS.md` gần nhất trong thư mục đó cũng được đính kèm
- `instructions` trong config: file, glob hoặc URL

Gõ `/init` để Kiwii khảo sát repo và viết `KIWII.md`. Tắt việc đọc file của Claude Code bằng `KIWII_DISABLE_CLAUDE_CODE=1`.

### Bộ nhớ dài hạn

Mỗi dự án có `MEMORY.md` tại `~/.local/share/kiwii/memory/<tên-dự-án>-<hash>/MEMORY.md` (hoặc `.kiwii/memory/MEMORY.md` nếu bạn tạo thư mục đó trong repo để commit chung). Nội dung là danh sách gạch đầu dòng, được đưa vào system prompt mọi phiên.

- Model tự lưu bằng tool `memory` (`save`, `search`, `list`); bạn có thể yêu cầu "nhớ rằng…".
- Sau mỗi lượt (tối đa một lần mỗi 6 tin nhắn), agent ẩn `memory` dùng `small_model` để trích các sự thật bền (lệnh build, quy ước, sở thích) và ghi thêm, bỏ trùng.
- Cấu hình: `"memory": { "auto": false }` tắt trích xuất tự động, `"max_lines": 200` giới hạn số dòng nạp; `KIWII_DISABLE_MEMORY=1` tắt hẳn (ẩn cả tool).
- File là Markdown thường, sửa tay thoải mái.

## English

Instruction files are loaded in priority order: global `~/.config/kiwii/KIWII.md`, `~/.kiwii/KIWII.md`, `~/.config/kiwii/AGENTS.md`, `~/.claude/CLAUDE.md`; project `KIWII.md`, `AGENTS.md`, `CLAUDE.md` walking up to the repo root; nested instruction files near files the model reads; and `instructions` entries from config. `/init` writes a `KIWII.md`.

Long-term memory lives in `MEMORY.md` under `~/.local/share/kiwii/memory/<project>-<hash>/` (or `.kiwii/memory/` when that folder exists) and is injected into every system prompt. The model saves notes with the `memory` tool, and a hidden `memory` agent extracts durable facts with the small model after turns (at most once per 6 messages). Configure with `memory.auto`, `memory.max_lines`, or disable everything with `KIWII_DISABLE_MEMORY=1`.
