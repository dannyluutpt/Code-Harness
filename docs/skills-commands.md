# Skills và slash commands

## Tiếng Việt

**Slash command tuỳ chỉnh:** file Markdown trong `.kiwii/command/<tên>.md` (dự án) hoặc `~/.config/kiwii/command/`. Frontmatter tuỳ chọn `description`, `agent`, `model`, `subtask`; thân file là template với `$ARGUMENTS`, `$1`, `$2`… và có thể nhúng lệnh shell bằng `` !`git status` ``.

```md
---
description: Viết test cho file
---
Viết unit test cho $ARGUMENTS theo phong cách hiện có trong repo. Chạy `bun test` để xác nhận.
```

Lệnh có sẵn: `/init` (tạo `KIWII.md`), `/review [commit|branch|pr]`, `/commit`, `/pr`, `/compact`, `/undo`, `/redo`, `/export`.

**Skills:** thư mục chứa `SKILL.md` với frontmatter `name`, `description`. Kiwii tìm tại `.kiwii/skills/`, `~/.config/kiwii/skills/`, và để tương thích Claude Code cả `~/.claude/skills/`, `.claude/skills/`, `.agents/skills/`. Skill xuất hiện như slash command và model có thể tự nạp qua tool `skill`. Thêm đường dẫn khác bằng `skills.paths`, tắt nguồn ngoài với `KIWII_DISABLE_EXTERNAL_SKILLS`.

## English

Custom slash commands are Markdown files in `.kiwii/command/<name>.md` or `~/.config/kiwii/command/` with optional `description`, `agent`, `model`, `subtask` frontmatter and `$ARGUMENTS`/`$1` placeholders. Built-ins: `/init`, `/review`, `/commit`, `/pr`, `/compact`, `/undo`, `/redo`, `/export`. Skills are `SKILL.md` folders discovered in `.kiwii/skills/`, `~/.config/kiwii/skills/`, and for Claude Code compatibility `~/.claude/skills/`, `.claude/skills/`, `.agents/skills/`; extra paths via `skills.paths`.
