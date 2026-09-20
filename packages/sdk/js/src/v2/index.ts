export * from "./client.js"
export * from "./server.js"

import { createKiwiiClient } from "./client.js"
import { createKiwiiServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createKiwii(options?: ServerOptions) {
  const server = await createKiwiiServer({
    ...options,
  })

  const client = createKiwiiClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
