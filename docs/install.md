# Cài đặt / Install

## Tiếng Việt

**Script cài nhanh (macOS, Linux, WSL):**

```sh
curl -fsSL https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install | bash
```

Script tải binary phù hợp từ GitHub Releases vào `~/.kiwii/bin` và thêm vào `PATH`. Tuỳ chọn: `VERSION=0.2.0` để ghim phiên bản, `--no-modify-path` để tự thêm PATH.

**Tải thủ công:** vào [Releases](https://github.com/dannyluutpt/Code-Harness/releases), tải `kiwii-<os>-<arch>.tar.gz` (Linux) hoặc `.zip` (macOS/Windows), giải nén và đặt `kiwii` vào `PATH`.

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install.ps1 | iex
```

Script tải `kiwii-windows-<arch>.zip` vào `%USERPROFILE%\.kiwii\bin` và thêm vào PATH của người dùng. Ghim phiên bản bằng `$env:VERSION = "0.2.0"` trước khi chạy; `$env:KIWII_NO_MODIFY_PATH = "1"` để tự thêm PATH. Khuyến nghị dùng Windows Terminal; WSL dùng script `install` ở trên.

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

Downloads the matching binary from GitHub Releases into `~/.kiwii/bin` and adds it to `PATH`. Options: `VERSION=0.2.0` pins a version, `--no-modify-path` skips shell rc edits.

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install.ps1 | iex
```

Downloads `kiwii-windows-<arch>.zip` into `%USERPROFILE%\.kiwii\bin` and adds it to the user PATH. Set `$env:VERSION = "0.2.0"` first to pin a version, `$env:KIWII_NO_MODIFY_PATH = "1"` to skip the PATH edit.

**Manual:** download `kiwii-<os>-<arch>.tar.gz` (Linux) or `.zip` (macOS/Windows) from [Releases](https://github.com/dannyluutpt/Code-Harness/releases), extract, and put `kiwii` on your `PATH`.

**From source:** requires Bun 1.3.14. `bun install && bun run --cwd packages/kiwii build -- --single`.

**Upgrade:** `kiwii upgrade`. **Uninstall:** `kiwii uninstall`.
