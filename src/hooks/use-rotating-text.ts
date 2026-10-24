import { useEffect, useState } from "react"

/** Cycles through `messages` every `intervalMs` while mounted. Used for friendly loading copy. */
export function useRotatingText(messages: readonly string[], intervalMs = 1400): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), intervalMs)
    return () => window.clearInterval(id)
  }, [messages, intervalMs])

  return messages[index % messages.length] ?? ""
}
