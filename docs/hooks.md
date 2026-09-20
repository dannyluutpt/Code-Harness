# Hooks

## Tiếng Việt

Hooks chạy lệnh shell tại các sự kiện, cấu hình trong `kiwii.json`, tương thích định dạng của Claude Code:

```jsonc
"hooks": {
  "PreToolUse": [
    { "matcher": "bash", "hooks": [{ "type": "command", "command": "./scripts/check-cmd.sh", "timeout": 10 }] },
    { "matcher": "edit|write", "hooks": [{ "type": "command", "command": "python3 scripts/protect.py" }] }
  ],
  "PostToolUse": [{ "matcher": "edit", "hooks": [{ "type": "command", "command": "bun run format" }] }],
  "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "echo '{\"additionalContext\":\"Hôm nay là thứ Hai\"}'" }] }],
  "Stop": [{ "hooks": [{ "type": "command", "command": "notify-send 'Kiwii xong'" }] }],
  "SessionStart": [], "SessionEnd": [], "PreCompact": [], "PermissionRequest": [], "Notification": []
}
```

- **Sự kiện:** `PreToolUse`, `PostToolUse` (theo tool, `matcher` là glob hoặc danh sách `a|b`), `UserPromptSubmit`, `Stop` (phiên rảnh), `SessionStart`, `SessionEnd`, `PreCompact`, `PermissionRequest`, `Notification` (khi có yêu cầu quyền).
- **Đầu vào:** JSON qua stdin với `hook_event_name`, `session_id`, `cwd`, `tool_name`, `tool_input`, `tool_response`, `prompt`, `permission`, `patterns`. Biến `KIWII_PROJECT_DIR` được đặt.
- **Đầu ra:** exit `2` chặn hành động và trả stderr cho model; exit khác `0` bị bỏ qua; stdout JSON có thể chứa `{"decision":"block"|"approve","reason":"...","additionalContext":"...","updatedInput":{...}}`. `updatedInput` sửa tham số tool trước khi chạy; `additionalContext` được nối vào kết quả tool, prompt hoặc ngữ cảnh nén; ở `PermissionRequest`, `decision` `allow`/`deny` trả lời yêu cầu quyền.
- Timeout mặc định 60 giây.

## English

Hooks run shell commands on events, configured in `kiwii.json` in the Claude Code format shown above. Events: `PreToolUse`, `PostToolUse` (with a tool `matcher` glob or `a|b` list), `UserPromptSubmit`, `Stop`, `SessionStart`, `SessionEnd`, `PreCompact`, `PermissionRequest`, `Notification`. The command receives a JSON payload on stdin (`hook_event_name`, `session_id`, `cwd`, `tool_name`, `tool_input`, `tool_response`, `prompt`, `permission`, `patterns`) and `KIWII_PROJECT_DIR`. Exit code 2 blocks the action and feeds stderr to the model; other non-zero exits are ignored; JSON on stdout may carry `decision`, `reason`, `additionalContext` or `updatedInput`. Default timeout is 60 s.
