export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@kiwii/schema/event"
import { EventManifest } from "@kiwii/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
