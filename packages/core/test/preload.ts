import path from "path"

process.env.KIWII_DB = ":memory:"
process.env.NPM_CONFIG_AUDIT = "false"
process.env.KIWII_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.KIWII_DISABLE_MODELS_FETCH = "true"
