import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["KIWII_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["KIWII_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("KIWII_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  KIWII_AUTO_HEAP_SNAPSHOT: truthy("KIWII_AUTO_HEAP_SNAPSHOT"),
  KIWII_GIT_BASH_PATH: process.env["KIWII_GIT_BASH_PATH"],
  KIWII_CONFIG: process.env["KIWII_CONFIG"],
  KIWII_CONFIG_CONTENT: process.env["KIWII_CONFIG_CONTENT"],
  KIWII_DISABLE_AUTOUPDATE: truthy("KIWII_DISABLE_AUTOUPDATE"),
  KIWII_ALWAYS_NOTIFY_UPDATE: truthy("KIWII_ALWAYS_NOTIFY_UPDATE"),
  KIWII_DISABLE_PRUNE: truthy("KIWII_DISABLE_PRUNE"),
  KIWII_DISABLE_TERMINAL_TITLE: truthy("KIWII_DISABLE_TERMINAL_TITLE"),
  KIWII_SHOW_TTFD: truthy("KIWII_SHOW_TTFD"),
  KIWII_DISABLE_AUTOCOMPACT: truthy("KIWII_DISABLE_AUTOCOMPACT"),
  KIWII_DISABLE_MODELS_FETCH: truthy("KIWII_DISABLE_MODELS_FETCH"),
  KIWII_DISABLE_MOUSE: truthy("KIWII_DISABLE_MOUSE"),
  KIWII_FAKE_VCS: process.env["KIWII_FAKE_VCS"],
  KIWII_SERVER_PASSWORD: process.env["KIWII_SERVER_PASSWORD"],
  KIWII_SERVER_USERNAME: process.env["KIWII_SERVER_USERNAME"],
  KIWII_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("KIWII_DISABLE_FFF"),

  // Experimental
  KIWII_EXPERIMENTAL_FILEWATCHER: Config.boolean("KIWII_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  KIWII_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("KIWII_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  KIWII_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("KIWII_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  KIWII_MODELS_URL: process.env["KIWII_MODELS_URL"],
  KIWII_MODELS_PATH: process.env["KIWII_MODELS_PATH"],
  KIWII_DB: process.env["KIWII_DB"],

  KIWII_WORKSPACE_ID: process.env["KIWII_WORKSPACE_ID"],
  KIWII_EXPERIMENTAL_WORKSPACES: enabledByExperimental("KIWII_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get KIWII_DISABLE_PROJECT_CONFIG() {
    return truthy("KIWII_DISABLE_PROJECT_CONFIG")
  },
  get KIWII_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("KIWII_EXPERIMENTAL_REFERENCES")
  },
  get KIWII_TUI_CONFIG() {
    return process.env["KIWII_TUI_CONFIG"]
  },
  get KIWII_CONFIG_DIR() {
    return process.env["KIWII_CONFIG_DIR"]
  },
  get KIWII_PURE() {
    return truthy("KIWII_PURE")
  },
  get KIWII_PERMISSION() {
    return process.env["KIWII_PERMISSION"]
  },
  get KIWII_PLUGIN_META_FILE() {
    return process.env["KIWII_PLUGIN_META_FILE"]
  },
  get KIWII_CLIENT() {
    return process.env["KIWII_CLIENT"] ?? "cli"
  },
}
