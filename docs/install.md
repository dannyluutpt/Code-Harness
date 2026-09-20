# Cài đặt / Install

## Tiếng Việt

**Script cài nhanh (macOS, Linux, WSL):**

```sh
curl -fsSL https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install | bash
```

Script tải binary phù hợp từ GitHub Releases vào `~/.kiwii/bin` và thêm vào `PATH`. Tuỳ chọn: `VERSION=0.1.0` để ghim phiên bản, `--no-modify-path` để tự thêm PATH.

**Tải thủ công:** vào [Releases](https://github.com/dannyluutpt/Code-Harness/releases), tải `kiwii-<os>-<arch>.tar.gz` (Linux) hoặc `.zip` (macOS/Windows), giải nén và đặt `kiwii` vào `PATH`.

**Windows:** dùng bản `kiwii-windows-x64.zip`; khuyến nghị chạy trong Windows Terminal hoặc WSL.

**Từ mã nguồn:** cần Bun 1.3.14.

```sh
git clone https://github.com/dannyluutpt/Code-Harness.git && cd Code-Harness
bun install
bun run --cwd packages/kiwii build -- --single   # binary tại packages/kiwii/dist/kiwii-<os>-<arch>/bin/kiwii
```

**Nâng cấp:** `kiwii upgrade` (hoặc chạy lại script cài).

**Gỡ:** `kiwii uninstall` xoá binary và dữ liệu trong `~/.local/share/kiwii`, `~/.config/kiwii`.

## English

**One-line install (macOS, Linux, WSL):**

```sh
curl -fsSL https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install | bash
```

Downloads the matching binary from GitHub Releases into `~/.kiwii/bin` and adds it to `PATH`. Options: `VERSION=0.1.0` pins a version, `--no-modify-path` skips shell rc edits.

**Manual:** download `kiwii-<os>-<arch>.tar.gz` (Linux) or `.zip` (macOS/Windows) from [Releases](https://github.com/dannyluutpt/Code-Harness/releases), extract, and put `kiwii` on your `PATH`.

**From source:** requires Bun 1.3.14. `bun install && bun run --cwd packages/kiwii build -- --single`.

**Upgrade:** `kiwii upgrade`. **Uninstall:** `kiwii uninstall`.
