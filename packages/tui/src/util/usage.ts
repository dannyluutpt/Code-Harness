import type { AssistantMessage, Message, Provider } from "@kiwii/sdk/v2"

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

// Context usage of a session: token count of the latest assistant turn and its share of the model's context window.
export function sessionUsage(messages: Message[], providers: Provider[]) {
  const last = messages.findLast(
    (item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0,
  )
  if (!last) return
  const tokens =
    last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
  if (tokens <= 0) return
  const limit = providers.find((item) => item.id === last.providerID)?.models[last.modelID]?.limit.context
  return {
    tokens,
    percent: limit ? Math.round((tokens / limit) * 100) : undefined,
  }
}
