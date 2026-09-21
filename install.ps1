<#
.SYNOPSIS
  Kiwii installer for Windows (PowerShell).
.DESCRIPTION
  Downloads the matching kiwii-windows-<arch>.zip from GitHub Releases into
  %USERPROFILE%\.kiwii\bin and adds that folder to the user PATH.
.EXAMPLE
  irm https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install.ps1 | iex
.EXAMPLE
  $env:VERSION = "0.3.0"; irm https://raw.githubusercontent.com/dannyluutpt/Code-Harness/main/install.ps1 | iex
#>
$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 5) {
  throw "Kiwii needs Windows PowerShell 5.1 or newer; this is $($PSVersionTable.PSVersion)."
}

$app = "kiwii"
$repo = "dannyluutpt/Code-Harness"
$requestedVersion = $env:VERSION
$noModifyPath = $env:KIWII_NO_MODIFY_PATH -eq "1"
$installDir = Join-Path $env:USERPROFILE ".kiwii\bin"

# Windows on ARM reports ARM64 through PROCESSOR_ARCHITECTURE (or the emulated one under x64 PowerShell).
$arch = if ($env:PROCESSOR_ARCHITEW6432 -eq "ARM64" -or $env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
$filename = "$app-windows-$arch.zip"
$url = if ($requestedVersion) {
  "https://github.com/$repo/releases/download/v$requestedVersion/$filename"
} else {
  "https://github.com/$repo/releases/latest/download/$filename"
}

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) "$app-install-$([guid]::NewGuid())"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$archive = Join-Path $tmp $filename

Write-Host "Downloading $url"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing

Write-Host "Extracting to $installDir"
Expand-Archive -Path $archive -DestinationPath $tmp -Force
$exe = Get-ChildItem -Path $tmp -Filter "$app.exe" -Recurse | Select-Object -First 1
if (-not $exe) { throw "$app.exe not found in $filename" }
Copy-Item -Path $exe.FullName -Destination (Join-Path $installDir "$app.exe") -Force
Remove-Item -Recurse -Force $tmp

if (-not $noModifyPath) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not ($userPath -split ";" | Where-Object { $_ -eq $installDir })) {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    Write-Host "Added $installDir to your user PATH (open a new terminal to use it)."
  }
  if (-not ($env:Path -split ";" | Where-Object { $_ -eq $installDir })) { $env:Path = "$env:Path;$installDir" }
}

# Windows PowerShell 5.1 turns native stderr into a terminating error under Stop, so keep this best-effort.
$version = try { & (Join-Path $installDir "$app.exe") --version } catch { "" }
Write-Host ""
Write-Host "Kiwii $version installed. Run '$app' in your project folder to start." -ForegroundColor Green
