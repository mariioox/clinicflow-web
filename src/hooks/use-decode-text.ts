import { useEffect, useState } from "react"
import { usePrefersReducedMotion } from "./use-reduced-motion"

const POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/**
 * Reveals `target` left to right, scrambling the characters not yet revealed
 * (e.g. a booking reference "CF-7K3Q-9XMD" decoding into place).
 * Dashes and spaces are never scrambled. With reduced motion it returns the target at once.
 *
 * Purely visual: screen readers should read the final value from elsewhere
 * (mark the animated element aria-hidden and provide the real text).
 */
export function useDecodeText(target: string, stepMs = 40): string {
  const reduced = usePrefersReducedMotion()
  const [text, setText] = useState(reduced ? target : "")

  useEffect(() => {
    if (reduced) {
      setText(target)
      return
    }
    let tick = 0
    const id = window.setInterval(() => {
      tick += 1
      const revealed = Math.floor(tick / 2)
      setText(
        target
          .split("")
          .map((ch, i) =>
            ch === "-" || ch === " " || i < revealed ? ch : POOL[Math.floor(Math.random() * POOL.length)],
          )
          .join(""),
      )
      if (revealed >= target.length) window.clearInterval(id)
    }, stepMs)
    return () => window.clearInterval(id)
  }, [target, stepMs, reduced])

  return text
}
