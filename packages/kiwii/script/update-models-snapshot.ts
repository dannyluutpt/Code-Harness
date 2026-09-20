#!/usr/bin/env bun
// Refresh packages/kiwii/models-snapshot.json from models.dev (requires network).
import path from "path"
import { fileURLToPath } from "url"

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const url = `${process.env.KIWII_MODELS_URL || "https://models.dev"}/api.json`
const text = await fetch(url).then((x) => {
  if (!x.ok) throw new Error(`${url}: ${x.status}`)
  return x.text()
})
JSON.parse(text)
await Bun.write(path.join(dir, "models-snapshot.json"), text)
console.log(`Wrote ${path.join(dir, "models-snapshot.json")}`)
