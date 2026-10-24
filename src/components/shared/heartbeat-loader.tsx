import { useRotatingText } from "@/hooks/use-rotating-text"
import { cn } from "@/lib/utils"

const DEFAULT_MESSAGES = [
  "Checking the schedule…",
  "Taking the clinic's pulse…",
  "Counting free chairs in the waiting room…",
  "Waking up the demo server (free hosting naps)…",
] as const

export type HeartbeatLoaderProps = {
  title: string
  messages?: readonly string[]
  className?: string
}

/** A heartbeat line that draws itself, with a title and friendly rotating copy. */
export function HeartbeatLoader({ title, messages = DEFAULT_MESSAGES, className }: HeartbeatLoaderProps) {
  const message = useRotatingText(messages)
  return (
    <div className={cn("flex items-center gap-4", className)} role="status" aria-live="polite">
      <span
        aria-hidden="true"
        className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary"
      >
        <svg width="40" height="22" viewBox="0 0 52 28">
          <path
            className="cf-ecg"
            d="M0 15h14l4-10 6 18 5-12 3 4h20"
            stroke="var(--accent)"
            strokeWidth="2.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-heading text-lg font-extrabold text-text">{title}</p>
        <p className="text-sm text-muted" aria-hidden="true">{message}</p>
      </div>
    </div>
  )
}
