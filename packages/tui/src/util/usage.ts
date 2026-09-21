import type { AssistantMessage, Message, Part, Provider } from "@kiwii/sdk/v2"

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

type Turn = { message: AssistantMessage; parts: Part[] }

// Milliseconds the model spent streaming, summed over text and reasoning spans. Tool calls sit
// between those spans, so a turn that shelled out for a minute is not reported as slow generation.
function streamingMs(parts: Part[]) {
  return parts.reduce((total, part) => {
    const time = part.type === "text" || part.type === "reasoning" ? part.time : undefined
    if (!time || time.end === undefined) return total
    return total + Math.max(0, time.end - time.start)
  }, 0)
}

/** Output tokens per second across one assistant turn, or undefined when it cannot be measured. */
export function turnSpeed(turn: Turn[]) {
  const output = turn.reduce((total, item) => total + item.message.tokens.output, 0)
  if (output <= 0) return
  const streaming = turn.reduce((total, item) => total + streamingMs(item.parts), 0)
  // Older turns predate part timings; fall back to the wall clock of the whole turn.
  const elapsed =
    streaming > 0 ? streaming : (turn.at(-1)?.message.time.completed ?? 0) - (turn[0]?.message.time.created ?? 0)
  if (elapsed <= 0) return
  return (output * 1000) / elapsed
}

/** One decimal below ten so a slow local model does not read as `0 tok/s`. */
export function speedLabel(speed: number) {
  return `${speed >= 10 ? Math.round(speed) : Math.round(speed * 10) / 10} tok/s`
}
