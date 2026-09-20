# MCP

## Tiếng Việt

Kiwii là MCP client cho server stdio và HTTP (Streamable HTTP, fallback SSE), có OAuth cho server từ xa.

```jsonc
"mcp": {
  "filesystem": { "type": "local", "command": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."], "environment": {} },
  "github": { "type": "remote", "url": "https://api.githubcopilot.com/mcp/", "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" } },
  "linear": { "type": "remote", "url": "https://mcp.linear.app/mcp", "oauth": {} }
}
```

Lệnh: `kiwii mcp add <tên> --url ...` hoặc `--env KEY=VAL`, `kiwii mcp list`, `kiwii mcp auth <tên>` (OAuth), `kiwii mcp debug <tên>`. Tool MCP có tên `<server>_<tool>` và tuân theo `permission`/`permissions` như tool thường; prompt của server xuất hiện như slash command; `/mcps` trong TUI để bật tắt.

## English

Kiwii is an MCP client for stdio and HTTP servers with OAuth support. Configure servers under `mcp` (see above) or with `kiwii mcp add`; `kiwii mcp auth <name>` runs the OAuth flow. MCP tools are named `<server>_<tool>`, are governed by the same permission rules, and server prompts show up as slash commands.
