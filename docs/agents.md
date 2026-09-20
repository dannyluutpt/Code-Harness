# Agents và subagents

## Tiếng Việt

Agent có sẵn: `build` (mặc định), `plan` (chỉ đọc, dùng cho permission mode `plan`), `general` và `explore` (subagent cho tool `task`), cùng các agent ẩn `title`, `summary`, `compaction`, `memory`.

Agent tuỳ chỉnh là file Markdown trong `.kiwii/agent/<tên>.md` hoặc `~/.config/kiwii/agent/`:

```md
---
description: Rà soát bảo mật cho thay đổi
mode: subagent          # primary | subagent | all
model: anthropic/claude-opus-5
temperature: 0.2
permission:
  edit: deny
  bash: { "git diff*": allow, "*": deny }
---
Bạn là chuyên gia bảo mật. Chỉ báo cáo lỗ hổng thật, kèm dòng mã và cách sửa.
```

`kiwii agent create` sinh file này bằng AI. Model gọi subagent qua tool `task` (nhiều subagent song song được), `subagent_depth` giới hạn độ sâu. Chuyển agent trong TUI bằng `Ctrl+Alt+A` hoặc `/agents`.

## English

Built-ins: `build` (default), `plan` (read-only, used by the `plan` permission mode), `general` and `explore` (subagents), plus hidden `title`, `summary`, `compaction`, `memory` agents. Custom agents are Markdown files in `.kiwii/agent/` or `~/.config/kiwii/agent/` with `description`, `mode`, `model`, `temperature`, `permission` frontmatter and the system prompt as the body; `kiwii agent create` generates one. The model invokes subagents through the `task` tool.
