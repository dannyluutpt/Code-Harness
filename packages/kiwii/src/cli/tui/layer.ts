import { run as runTui, type TuiInput } from "@kiwii/tui"
import { Global } from "@kiwii/core/global"
import { AppNodeBuilder } from "@kiwii/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
