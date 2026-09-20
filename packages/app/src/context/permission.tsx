import { createEffect, createMemo, createRoot, getOwner, onCleanup } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { createSimpleContext } from "@kiwii/ui/context"
import type { PermissionRequest } from "@kiwii/sdk/v2/client"
import { Persist, persisted } from "@/utils/persist"
import type { ServerSDK } from "@/context/server-sdk"
import type { ServerSync } from "./server-sync"
import { useParams, useSearchParams } from "@solidjs/router"
import { decode64 } from "@/utils/base64"
import { useGlobal } from "./global"
import { ServerConnection, useServer } from "./server"
import { type DraftTab, useTabs } from "./tabs"
import { useSettings } from "./settings"
import { requireServerKey } from "@/utils/session-route"
import type { ServerScope } from "@/utils/server-scope"
import { normalizePermissionRequest } from "./global-sync/utils"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"
import {
  acceptKey,
  directoryAcceptKey,
  autoRespondsPermission,
  directoryPermissionMode,
  migratePermissionModes,
  permissionMode,
  sessionPermissionMode,
  type PermissionModes,
} from "./permission-auto-respond"

type PermissionRespondFn = (input: {
  sessionID: string
  permissionID: string
  response: "once" | "always" | "reject"
  directory?: string
}) => void

function isNonAllowRule(rule: unknown) {
  if (!rule) return false
  if (typeof rule === "string") return rule !== "allow"
  if (typeof rule !== "object") return false
  if (Array.isArray(rule)) return false

  for (const action of Object.values(rule)) {
    if (action !== "allow") return true
  }

  return false
}

function hasPermissionPromptRules(permission: unknown) {
  if (!permission) return false
  if (typeof permission === "string") return permission !== "allow"
  if (typeof permission !== "object") return false
  if (Array.isArray(permission)) return false

  const config = permission as Record<string, unknown>
  return Object.values(config).some(isNonAllowRule)
}

export const { use: usePermission, provider: PermissionProvider } = createSimpleContext({
  name: "Permission",
  gate: false,
  init: () => {
    const params = useParams<{ serverKey?: string; dir?: string; id?: string }>()
    const [search] = useSearchParams<{ draftId?: string }>()
    const global = useGlobal()
    const server = useServer()
    const tabs = useTabs()
    const settings = useSettings()
    const owner = getOwner()
    const states = new Map<ServerScope, { key: ServerConnection.Key; dispose: () => void; state: PermissionState }>()

    const activeDraft = createMemo(() => {
      if (!search.draftId) return
      return tabs.store.find((tab): tab is DraftTab => tab.type === "draft" && tab.draftID === search.draftId)
    })

    const activeServer = createMemo(() => {
      if (params.serverKey && settings.general.newLayoutDesigns()) return requireServerKey(params.serverKey)
      return activeDraft()?.server ?? server.key
    })

    const ensure = (key: ServerConnection.Key) => {
      const conn = global.servers.list().find((item) => ServerConnection.key(item) === key)
      if (!conn) throw new Error(`Permission server not found: ${key}`)
      const ctx = global.ensureServerCtx(conn)
      const existing = states.get(ctx.sdk.scope)
      if (existing && global.servers.list().some((item) => ServerConnection.key(item) === existing.key)) {
        return existing.state
      }
      if (existing) {
        existing.dispose()
        states.delete(ctx.sdk.scope)
      }
      const root = createRoot(
        (dispose) => ({
          key,
          dispose,
          state: createServerPermissionState({ sdk: ctx.sdk, sync: ctx.sync }),
        }),
        owner ?? undefined,
      )
      states.set(ctx.sdk.scope, root)
      return root.state
    }

    createEffect(() => {
      global.servers.list().forEach((conn) => ensure(ServerConnection.key(conn)))
    })

    createEffect(() => {
      const list = global.servers.list()
      const keys = new Set(list.map(ServerConnection.key))
      states.forEach((value, scope) => {
        if (keys.has(value.key)) return
        value.dispose()
        states.delete(scope)
        const replacement = list.find((conn) => server.scope(ServerConnection.key(conn)) === scope)
        if (replacement) ensure(ServerConnection.key(replacement))
      })
    })

    onCleanup(() => states.forEach((value) => value.dispose()))

    let lastSelected: PermissionState | undefined
    const selected = () => {
      const key = activeServer()
      if (global.servers.list().some((conn) => ServerConnection.key(conn) === key)) {
        lastSelected = ensure(key)
      }
      if (lastSelected) return lastSelected
      return ensure(server.key)
    }
    const activeDirectory = createMemo(() => {
      const directory = decode64(params.dir)
      if (directory) return directory
      const draft = activeDraft()
      if (draft) return draft.directory
      if (!params.id) return
      if (!global.servers.list().some((conn) => ServerConnection.key(conn) === activeServer())) return
      return selected().sync.session.lineage.peek(params.id)?.session.directory
    })

    createEffect(() => {
      const directory = activeDirectory()
      if (!directory) return
      selected().enableConfiguredDirectory(directory)
    })

    const permissionsEnabled = createMemo(() => {
      const directory = activeDirectory()
      if (!directory) return false
      return selected().permissionsEnabled(directory)
    })

    return {
      ready: () => selected().ready(),
      ensureServerState: (key: ServerConnection.Key) => ensure(key).api,
      currentServerState: () => selected().api,
      respond(input: Parameters<PermissionRespondFn>[0]) {
        selected().respond(input)
      },
      autoResponds(permission: PermissionRequest, directory?: string) {
        return selected().autoResponds(permission, directory)
      },
      /** The session's mode, or the directory-level mode while no session exists yet. */
      mode(sessionID: string | undefined, directory: string) {
        return selected().mode(sessionID, directory)
      },
      setMode(sessionID: string | undefined, directory: string, mode: ConfigPermissionV1.Mode) {
        selected().setMode(sessionID, directory, mode)
      },
      permissionsEnabled,
      isPermissionAllowAll(directory: string) {
        return selected().isPermissionAllowAll(directory)
      },
    }
  },
})

type PermissionState = ReturnType<typeof createServerPermissionState>
type PermissionEvent = Parameters<Parameters<ServerSDK["event"]["listen"]>[0]>[0]

function createServerPermissionState(input: { sdk: ServerSDK; sync: ServerSync }) {
  const [store, setStore, _, ready] = persisted(
    {
      ...Persist.serverGlobal(input.sdk.scope, "permission", ["permission.v3"]),
      migrate: migratePermissionModes,
    },
    createStore({
      mode: {} as PermissionModes,
    }),
  )

  function enableConfiguredDirectory(directory: string) {
    if (input.sdk.protocolKind() !== "v1") return
    if (meta.disposed || !ready()) return
    const [childStore] = input.sync.child(directory)
    if (childStore.config.permission !== "allow") return
    const key = directoryAcceptKey(directory)
    if (store.mode[key] !== undefined) return
    setStore(
      produce((draft) => {
        draft.mode[key] = "bypassPermissions"
      }),
    )
  }

  const MAX_RESPONDED = 1000
  const RESPONDED_TTL_MS = 60 * 60 * 1000
  const responded = new Map<string, number>()
  const modeVersion = new Map<string, number>()
  const meta = { disposed: false }

  function pruneResponded(now: number) {
    for (const [id, ts] of responded) {
      if (now - ts < RESPONDED_TTL_MS) break
      responded.delete(id)
    }

    for (const id of responded.keys()) {
      if (responded.size <= MAX_RESPONDED) break
      responded.delete(id)
    }
  }

  const respond: PermissionRespondFn = (request) => {
    if (meta.disposed) return
    input.sdk.api.permission
      .reply({
        sessionID: request.sessionID,
        requestID: request.permissionID,
        reply: request.response,
        location: request.directory ? { directory: request.directory } : undefined,
      })
      .catch(() => {
        responded.delete(request.permissionID)
      })
  }

  const list = async (directory: string) => {
    if ((await input.sdk.protocol) === "v1") {
      return (await input.sdk.client.permission.list({ directory })).data ?? []
    }
    return input.sdk.api.permission.request
      .list({ location: { directory } })
      .then((result) => result.data.map(normalizePermissionRequest))
  }

  function respondOnce(permission: PermissionRequest, directory?: string) {
    const now = Date.now()
    const hit = responded.has(permission.id)
    responded.delete(permission.id)
    responded.set(permission.id, now)
    pruneResponded(now)
    if (hit) return
    respond({
      sessionID: permission.sessionID,
      permissionID: permission.id,
      response: "once",
      directory,
    })
  }

  function sessions(directory?: string) {
    const info = Object.values(input.sync.session.data.info).filter((session) => !!session)
    if (!directory) return info
    return [...info, ...input.sync.child(directory, { bootstrap: false })[0].session]
  }

  function mode(sessionID: string | undefined, directory: string) {
    if (!sessionID) return directoryPermissionMode(store.mode, directory)
    return permissionMode(store.mode, sessions(directory), { sessionID }, directory)
  }

  function shouldAutoRespond(permission: PermissionRequest, directory?: string) {
    return autoRespondsPermission(store.mode, sessions(directory), permission, directory)
  }

  function isPending(permission: PermissionRequest) {
    const pending = input.sync.session.data.permission[permission.sessionID]
    return pending === undefined || pending.some((item) => item.id === permission.id)
  }

  async function shouldAutoRespondResolved(permission: PermissionRequest, directory?: string) {
    if (sessionPermissionMode(store.mode, sessions(directory), permission, directory))
      return shouldAutoRespond(permission, directory)
    if (input.sync.session.lineage.peek(permission.sessionID)) return shouldAutoRespond(permission, directory)
    const lineage = await input.sync.session.lineage.resolve(permission.sessionID).catch(() => undefined)
    if (meta.disposed || !lineage) return false
    return shouldAutoRespond(permission, directory)
  }

  async function respondPending(
    permission: PermissionRequest,
    directory?: string,
    current: () => boolean = () => true,
  ) {
    if (!current() || !isPending(permission)) return
    if (!(await shouldAutoRespondResolved(permission, directory))) return
    if (meta.disposed || !current() || !isPending(permission)) return
    respondOnce(permission, directory)
  }

  const handlePermission = (e: PermissionEvent) => {
    const event = e.details
    if (event?.type !== "permission.asked") return
    void respondPending(event.properties, e.name)
  }

  const unsubscribe = input.sdk.event.listen((event) => {
    if (ready()) {
      handlePermission(event)
      return
    }
    void ready.promise?.then(() => {
      if (meta.disposed) return
      handlePermission(event)
    })
  })
  onCleanup(() => {
    meta.disposed = true
    unsubscribe()
  })

  function setMode(sessionID: string | undefined, directory: string, next: ConfigPermissionV1.Mode) {
    if (meta.disposed) return
    const key = sessionID ? acceptKey(sessionID, directory) : directoryAcceptKey(directory)
    const version = (modeVersion.get(key) ?? 0) + 1
    modeVersion.set(key, version)
    setStore(
      produce((draft) => {
        draft.mode[key] = next
        if (sessionID) delete draft.mode[sessionID]
      }),
    )
    if (next === "default" || next === "plan") return

    // Requests that were already waiting when the mode changed get the same treatment as new ones.
    list(directory)
      .then((permissions) => {
        if (meta.disposed || modeVersion.get(key) !== version) return
        for (const permission of permissions) {
          void respondPending(permission, directory, () => modeVersion.get(key) === version)
        }
      })
      .catch(() => undefined)
  }

  const api = {
    ready: () => !meta.disposed && ready(),
    respond,
    autoResponds(permission: PermissionRequest, directory?: string) {
      if (meta.disposed) return false
      return shouldAutoRespond(permission, directory)
    },
    mode(sessionID: string | undefined, directory: string): ConfigPermissionV1.Mode {
      if (meta.disposed) return "default"
      return mode(sessionID, directory)
    },
    setMode,
    isPermissionAllowAll(directory: string) {
      if (meta.disposed) return false
      const [childStore] = input.sync.child(directory)
      return childStore.config.permission === "allow"
    },
  }

  return {
    ...api,
    api,
    sync: input.sync,
    enableConfiguredDirectory,
    permissionsEnabled(directory: string) {
      if (meta.disposed) return false
      const [childStore] = input.sync.child(directory)
      return hasPermissionPromptRules(childStore.config.permission)
    },
  }
}
