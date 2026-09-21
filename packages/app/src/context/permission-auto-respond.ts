import { base64Encode } from "@kiwii/core/util/encode"
import { ConfigPermissionV1 } from "@kiwii/core/v1/config/permission"

export type PermissionModes = Record<string, ConfigPermissionV1.Mode>

export function acceptKey(sessionID: string, directory?: string) {
  if (!directory) return sessionID
  return `${base64Encode(directory)}/${sessionID}`
}

export function directoryAcceptKey(directory: string) {
  return `${base64Encode(directory)}/*`
}

/**
 * Upgrades the persisted boolean auto-accept store to permission modes. The old toggle replied "once" to every
 * request, so `true` becomes bypassPermissions; `false` stays an explicit default so it still overrides a parent.
 */
export function migratePermissionModes(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const data = value as Record<string, unknown>
  if (data.mode && typeof data.mode === "object" && !Array.isArray(data.mode)) return value
  const legacy = [data.autoAccept, data.autoAcceptEdits].find(
    (item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item),
  )
  return {
    mode: Object.fromEntries(
      Object.entries(legacy ?? {})
        .filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
        .map(([key, accept]) => [key, accept ? "bypassPermissions" : "default"]),
    ),
  }
}

export function directoryPermissionMode(modes: PermissionModes, directory: string) {
  return modes[directoryAcceptKey(directory)] ?? "default"
}

function sessionLineage(session: { id: string; parentID?: string }[], sessionID: string) {
  const parent = session.reduce((acc, item) => {
    if (item.parentID) acc.set(item.id, item.parentID)
    return acc
  }, new Map<string, string>())
  const seen = new Set([sessionID])
  const ids = [sessionID]

  for (const id of ids) {
    const parentID = parent.get(id)
    if (!parentID || seen.has(parentID)) continue
    seen.add(parentID)
    ids.push(parentID)
  }

  return ids
}

/** The mode set on the session or the nearest ancestor, ignoring the directory fallback. */
export function sessionPermissionMode(
  modes: PermissionModes,
  session: { id: string; parentID?: string }[],
  permission: { sessionID: string },
  directory?: string,
) {
  return sessionLineage(session, permission.sessionID)
    .map((id) => modes[acceptKey(id, directory)] ?? modes[id])
    .find((item) => item !== undefined)
}

export function permissionMode(
  modes: PermissionModes,
  session: { id: string; parentID?: string }[],
  permission: { sessionID: string },
  directory?: string,
) {
  const mode = sessionPermissionMode(modes, session, permission, directory)
  if (mode) return mode
  return directory ? directoryPermissionMode(modes, directory) : "default"
}

export function autoRespondsPermission(
  modes: PermissionModes,
  session: { id: string; parentID?: string }[],
  permission: { sessionID: string; permission: string; patterns?: ReadonlyArray<string> },
  directory?: string,
) {
  return ConfigPermissionV1.autoApprove(
    permissionMode(modes, session, permission, directory),
    permission.permission,
    permission.patterns,
  )
}
