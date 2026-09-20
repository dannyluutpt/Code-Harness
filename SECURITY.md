# Security

Kiwii runs commands and edits files on your machine on behalf of a language model. Use permission modes and `permissions.deny` to fence it in, and never run `bypassPermissions` on machines you cannot afford to lose.

Credentials are stored in `~/.local/share/kiwii/auth.json` with mode 600. Kiwii does not send data anywhere except the model providers you configure (and web search / MCP servers you enable).

To report a vulnerability, open a private security advisory at https://github.com/dannyluutpt/Code-Harness/security/advisories/new. Please do not file public issues for security problems.
