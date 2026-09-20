// @ts-nocheck

import { Kiwii } from "@kiwii/core"
import { ReadTool } from "@kiwii/core/tools"

const kiwii = Kiwii.make({})

kiwii.tool.add(ReadTool)

kiwii.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

kiwii.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

kiwii.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await kiwii.session.create({
  agent: "build",
})

kiwii.subscribe((event) => {
  console.log(event)
})

await kiwii.session.prompt({
  sessionID,
  text: "hey what is up",
})

await kiwii.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await kiwii.session.wait()

console.log(await kiwii.session.messages(sessionID))
