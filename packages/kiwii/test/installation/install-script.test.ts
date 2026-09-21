import { describe, expect, test } from "bun:test"
import { chmod, mkdir, mkdtemp, readdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const script = path.join(import.meta.dir, "..", "..", "..", "..", "install")

// Drives the real installer through its --binary path: the archive path would need a release download.
async function install(name: string) {
  const dir = await mkdtemp(path.join(tmpdir(), "kiwii-install-"))
  const source = path.join(dir, name)
  await writeFile(source, "#!/bin/sh\necho fake\n")
  await chmod(source, 0o755)
  const home = path.join(dir, "home")
  await mkdir(home)
  const proc = Bun.spawn(["bash", script, "--binary", source, "--no-modify-path"], {
    env: { ...process.env, HOME: home },
    stdout: "pipe",
    stderr: "pipe",
  })
  await proc.exited
  return readdir(path.join(home, ".kiwii", "bin"))
}

describe("install script", () => {
  // Windows archives ship kiwii.exe. Dropping the suffix leaves the kiwii.exe already on PATH in
  // place, so `kiwii upgrade` reports success and the old build keeps running.
  test("keeps the .exe suffix", async () => {
    expect(await install("kiwii.exe")).toEqual(["kiwii.exe"])
  })

  test("installs a bare kiwii everywhere else", async () => {
    expect(await install("kiwii")).toEqual(["kiwii"])
  })
})
