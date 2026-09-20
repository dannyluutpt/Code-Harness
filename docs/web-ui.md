# Web UI

## Tiếng Việt

`kiwii web` khởi động server và mở giao diện web (nhúng sẵn trong binary) tại `http://localhost:<port>`. Cờ: `--port`, `--hostname 0.0.0.0` để mở trong LAN (bắt buộc đặt `KIWII_SERVER_PASSWORD`, tài khoản `kiwii`). Web UI dùng cùng phiên, cấu hình, permission mode và hooks với TUI; có giao diện tiếng Việt (chọn trong Settings).

`kiwii serve` chỉ chạy server (API tại `/doc` là OpenAPI) để nối từ Web UI khác, IDE, hoặc `kiwii attach <url>`.

Khi chạy từ mã nguồn (`bun dev web`), nếu chưa build bundle, server proxy tới Vite dev server `bun run dev:web` (mặc định `http://localhost:3000`, đổi bằng `KIWII_WEB_UI_URL`).

## English

`kiwii web` starts the server and opens the embedded web UI at `http://localhost:<port>`; use `--hostname 0.0.0.0` with `KIWII_SERVER_PASSWORD` to expose it on the LAN. The web UI shares sessions, config, permission modes and hooks with the TUI and includes a Vietnamese translation. `kiwii serve` runs the API alone (OpenAPI at `/doc`) for `kiwii attach <url>` or other clients. From source without a built bundle, the server proxies a Vite dev server (`KIWII_WEB_UI_URL`, default `http://localhost:3000`).
