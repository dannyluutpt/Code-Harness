import type { TuiPlugin, TuiPluginApi } from "@kiwii/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { createMemo, For, Show, createSignal } from "solid-js"
import { Locale } from "../../util/locale"
import { SIDEBAR_WIDTH } from "../../util/layout"

const id = "internal:sidebar-files"

function changeCountWidth(item: { additions: number; deletions: number }) {
  return [item.additions ? `+${item.additions}` : "", item.deletions ? `-${item.deletions}` : ""]
    .filter(Boolean)
    .join(" ").length
}

// Left-truncate at a path separator so the filename survives: "…/prompt/index.tsx".
function fitPath(file: string, width: number) {
  const cut = Locale.truncateLeft(file, width)
  if (cut === file || cut.indexOf("/", 1) === -1) return cut
  return "…" + cut.slice(cut.indexOf("/", 1))
}

function View(props: { api: TuiPluginApi; session_id: string }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const list = createMemo(() => props.api.state.session.diff(props.session_id))

  return (
    <Show when={list().length > 0}>
      <box>
        <box flexDirection="row" gap={1} onMouseDown={() => list().length > 2 && setOpen((x) => !x)}>
          <Show when={list().length > 2}>
            <text fg={theme().secondary}>{open() ? "▼" : "▶"}</text>
          </Show>
          <text fg={theme().secondary}>
            <b>modified files</b>
          </text>
        </box>
        <Show when={list().length <= 2 || open()}>
          <For each={list()}>
            {(item) => (
              <box flexDirection="row" gap={1} justifyContent="space-between">
                {/* 6 = sidebar padding (4) + scrollbox gutter (1) + gap before the counts (1) */}
                <text fg={theme().textMuted} wrapMode="none">
                  {fitPath(item.file, Math.max(2, SIDEBAR_WIDTH - 6 - changeCountWidth(item)))}
                </text>
                <box flexDirection="row" gap={1} flexShrink={0}>
                  <Show when={item.additions}>
                    <text fg={theme().diffAdded}>+{item.additions}</text>
                  </Show>
                  <Show when={item.deletions}>
                    <text fg={theme().diffRemoved}>-{item.deletions}</text>
                  </Show>
                </box>
              </box>
            )}
          </For>
        </Show>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 500,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: BuiltinTuiPlugin = {
  id,
  tui,
}

export default plugin
