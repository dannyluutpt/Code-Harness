import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("KIWII_EXPERIMENTAL")
// Features that are on by default in Kiwii; set the env var to "false" to opt out.
const enabledByDefault = (name: string) => Config.boolean(name).pipe(Config.withDefault(true))
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@kiwii/RuntimeFlags", {
  autoShare: bool("KIWII_AUTO_SHARE"),
  pure: bool("KIWII_PURE"),
  disableDefaultPlugins: bool("KIWII_DISABLE_DEFAULT_PLUGINS"),
  disableEmbeddedWebUi: bool("KIWII_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("KIWII_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("KIWII_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("KIWII_DISABLE_CLAUDE_CODE"),
    direct: bool("KIWII_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("KIWII_DISABLE_CLAUDE_CODE"),
    direct: bool("KIWII_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("KIWII_ENABLE_EXA"),
    legacy: bool("KIWII_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("KIWII_ENABLE_PARALLEL"),
    legacy: bool("KIWII_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("KIWII_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("KIWII_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("KIWII_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("KIWII_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("KIWII_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByDefault("KIWII_ENABLE_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("KIWII_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByDefault("KIWII_ENABLE_PLAN_MODE"),
  experimentalCodeMode: enabledByExperimental("KIWII_EXPERIMENTAL_CODE_MODE"),
  experimentalEventSystem: enabledByExperimental("KIWII_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("KIWII_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("KIWII_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("KIWII_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("KIWII_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("KIWII_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("KIWII_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("KIWII_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.layer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const node = LayerNode.make({ service: Service, layer: Service.layer.pipe(Layer.orDie), deps: [] })

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@kiwii/core/effect/layer-node"
