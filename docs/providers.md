# Provider và đăng nhập / Providers and auth

## Tiếng Việt

Kiwii dùng danh mục [models.dev](https://models.dev) (kèm snapshot offline trong repo). Cách cấp key:

| Provider | Cách dùng |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY` hoặc `kiwii auth login` → Anthropic |
| OpenAI | `OPENAI_API_KEY`, hoặc `kiwii auth login` → OpenAI → đăng nhập ChatGPT Plus/Pro (OAuth, giống Codex CLI) |
| Google Gemini | `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Ollama | Chạy `ollama serve`; Kiwii tự phát hiện tại `OLLAMA_HOST` (mặc định `http://localhost:11434`) và liệt kê model đã tải. Tắt bằng `KIWII_DISABLE_OLLAMA=1` |
| llama.cpp | Chạy `llama-server -m model.gguf --jinja` (cần `--jinja` để gọi tool); Kiwii tự phát hiện tại `LLAMACPP_HOST` (mặc định `http://localhost:8080`) và hiện dưới provider `llamacpp`. Tắt bằng `KIWII_DISABLE_LLAMACPP=1` |
| OpenAI-compatible bất kỳ | Khai báo trong `provider` (xem config.md) với `npm: "@ai-sdk/openai-compatible"` và `options.baseURL` |

Chọn model: `kiwii --model anthropic/claude-sonnet-5`, `/model` trong TUI, hoặc khoá `model` trong config. `disabled_providers` / `enabled_providers` để lọc danh sách. Key lưu mã hoá quyền 600 tại `~/.local/share/kiwii/auth.json`.

## English

Kiwii uses the [models.dev](https://models.dev) catalog (with an offline snapshot in the repo). Credentials: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or ChatGPT Plus/Pro OAuth via `kiwii auth login`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`; a running Ollama is auto-detected at `OLLAMA_HOST`; a running llama.cpp `llama-server` is auto-detected at `LLAMACPP_HOST` (default `http://localhost:8080`, start it with `--jinja` for tool calling, disable with `KIWII_DISABLE_LLAMACPP=1`); any OpenAI-compatible endpoint can be declared under `provider`. Pick a model with `--model provider/model`, `/model`, or the `model` config key. Credentials live in `~/.local/share/kiwii/auth.json` (mode 600).
