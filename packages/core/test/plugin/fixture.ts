import { AgentV2 } from "@kiwii/core/agent"
import { AISDK } from "@kiwii/core/aisdk"
import { Catalog } from "@kiwii/core/catalog"
import { CommandV2 } from "@kiwii/core/command"
import { Credential } from "@kiwii/core/credential"
import { AppNodeBuilder } from "@kiwii/core/effect/app-node-builder"
import { LayerNodePlatform } from "@kiwii/core/effect/app-node-platform"
import { LayerNode } from "@kiwii/core/effect/layer-node"
import { EventV2 } from "@kiwii/core/event"
import { FileSystem } from "@kiwii/core/filesystem"
import { FSUtil } from "@kiwii/core/fs-util"
import { Integration } from "@kiwii/core/integration"
import { Location } from "@kiwii/core/location"
import { Npm } from "@kiwii/core/npm"
import { PluginV2 } from "@kiwii/core/plugin"
import { Reference } from "@kiwii/core/reference"
import { SkillV2 } from "@kiwii/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)
