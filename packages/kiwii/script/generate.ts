import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

// Snapshot committed in the repo so builds work offline. Refresh with `bun run script/update-models-snapshot.ts`.
const snapshot = path.join(dir, "models-snapshot.json")
const modelsUrl = process.env.KIWII_MODELS_URL || "https://models.dev"

async function load() {
  if (process.env.MODELS_DEV_API_JSON) return Bun.file(process.env.MODELS_DEV_API_JSON).text()
  const fetched = await fetch(`${modelsUrl}/api.json`, { signal: AbortSignal.timeout(15_000) })
    .then((x) => (x.ok ? x.text() : undefined))
    .catch(() => undefined)
  if (fetched) {
    JSON.parse(fetched)
    await Bun.write(snapshot, fetched)
    console.log("Loaded models.dev catalog from network and refreshed models-snapshot.json")
    return fetched
  }
  console.log("models.dev unreachable; using committed models-snapshot.json")
  return Bun.file(snapshot).text()
}

export const modelsData = await load()
