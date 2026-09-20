import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@kiwii/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~kiwii/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~kiwii/WorkspaceRef", {
  defaultValue: () => undefined,
})
