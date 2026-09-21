# Quyền hạn / Permissions

## Tiếng Việt

### Permission mode (giống Claude Code)

| Mode | Hành vi |
|---|---|
| `default` | Hỏi theo ruleset; mặc định mọi tool được phép trừ đọc `.env*`, thư mục ngoài dự án, và các quy tắc bạn đặt |
| `acceptEdits` | Tự duyệt đọc/ghi/sửa file, glob/grep; vẫn hỏi cho bash, webfetch, v.v. |
| `plan` | Chỉ đọc: chuyển sang agent `plan` (không sửa file trừ `.kiwii/plans/*.md`), dùng `plan_exit` khi xong |
| `auto` | Tự duyệt theo luật cố định: đọc/sửa file, todo, LSP, skill, subagent, websearch và các lệnh shell chỉ-đọc hoặc kiểm thử đã biết (`ls`, `cat`, `rg`, `git status/diff/log`, `bun test`, `npm run lint`, `cargo check`…). Lệnh có `>`, `;`, `|`, `&`, `$(…)`, webfetch, thư mục ngoài dự án và mọi lệnh khác vẫn hỏi |
| `bypassPermissions` | Duyệt tất cả những gì không bị `deny` (nguy hiểm) |

Đặt mode: cờ `--permission-mode acceptEdits`, biến `KIWII_PERMISSION_MODE`, khoá `permission_mode` trong `kiwii.json`, phím `Shift+Tab`, lệnh `/permissions <manual|accept-edits|plan|auto|bypass>` hoặc bảng lệnh trong TUI. `Shift+Tab` xoay vòng manual → accept edits → plan → auto; `bypassPermissions` chỉ vào vòng khi đã được bật tường minh (cờ, biến môi trường, config, `/permissions bypass` hoặc bảng lệnh). `--auto` tương đương `--permission-mode auto`; `--yolo`/`--dangerously-skip-permissions` tương đương `bypassPermissions`. Trong `kiwii run`, mode `default` tự từ chối yêu cầu quyền (không có ai để hỏi), nên dùng `acceptEdits` hoặc `bypassPermissions` cho CI.

**Màu khung nhập trong TUI** đổi theo mode đang bật, nên nhìn viền là biết mình đang ở đâu:

| Mode | Màu |
|---|---|
| `default` (manual) | xanh lá |
| `plan` | xanh dương |
| `acceptEdits` | vàng |
| `auto` | cam |
| `bypassPermissions` | đỏ |

Theme đổi được năm màu này qua các khoá `permissionDefault`, `permissionPlan`, `permissionAcceptEdits`, `permissionAuto`, `permissionBypass` trong file theme; bỏ trống thì dùng màu mặc định ở bảng trên.

### Allow/deny list

```jsonc
"permissions": {
  "allow": ["Bash(git *)", "Bash(bun test*)", "Edit(src/**)", "WebFetch(domain:docs.bun.sh)"],
  "ask":   ["Bash(rm *)"],
  "deny":  ["Read(.env)", "Bash(git push *)", "mcp__github__delete_repo"]
}
```

Tên tool: `Bash`, `Edit`/`Write`, `Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Task`, `Skill`, `mcp__server__tool`. Mẫu trong ngoặc là glob (`*`), `Bash(npm run:*)` cũng được hiểu. Các mục được chuyển thành ruleset gốc `permission` với `deny` đứng cuối nên `deny` luôn thắng, kể cả ở mode `bypassPermissions`.

### Ruleset gốc

`permission` là bản đồ `tool → action` hoặc `tool → { pattern: action }` với action `allow | ask | deny`; quy tắc khai báo sau thắng. Từng agent có thể ghi đè bằng `agent.<tên>.permission`.

## English

Modes: `default` (ask per rules), `acceptEdits` (auto-approve file reads/edits), `plan` (read-only via the built-in `plan` agent), `auto` (rule-based: auto-approves file edits, read-only tools and a fixed list of read-only/test shell commands; anything with redirection, chaining or substitution, webfetch, external directories and every other command still asks), `bypassPermissions` (approve everything not denied). Set with `--permission-mode`, `KIWII_PERMISSION_MODE`, `permission_mode` in config, `Shift+Tab` or `/permissions <manual|accept-edits|plan|auto|bypass>` in the TUI (`Shift+Tab` cycles manual → accept edits → plan → auto, and includes `bypassPermissions` only after it was enabled explicitly); `--auto` means `--permission-mode auto`; `--yolo`/`--dangerously-skip-permissions` mean `bypassPermissions`. Headless `kiwii run` auto-rejects prompts in `default`, so use `acceptEdits` or `bypassPermissions` in CI.

**The TUI prompt border is colored by mode** so the active mode is readable at a glance: green for `default`, blue for `plan`, yellow for `acceptEdits`, orange for `auto`, red for `bypassPermissions`. A theme can override them with the `permissionDefault`, `permissionPlan`, `permissionAcceptEdits`, `permissionAuto` and `permissionBypass` keys.

`permissions.allow/ask/deny` accept Claude Code style entries (`Bash(git *)`, `Edit(src/**)`, `WebFetch(domain:x)`, `mcp__server__tool`); they are converted into the native `permission` ruleset with deny last, so deny always wins. The native `permission` map (`tool → action` or `tool → {pattern: action}`) is still available and can be overridden per agent.
