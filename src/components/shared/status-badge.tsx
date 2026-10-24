import type { Status } from "@/models"
import { STATUS_LABELS } from "@/utils/status"
import { StatusBadge as UiStatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge"

export type StatusBadgeProps = {
  status: Status
  className?: string
}

const statusToneMap: Record<Status, StatusBadgeTone> = {
  BOOKED: "info",
  WAITING: "warning",
  IN_CONSULTATION: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
}

// Each status gets its own tokenised colour (white text on each is 5:1 or better).
// The text label is always shown, so colour is never the only signal.
const statusColour: Record<Status, string> = {
  BOOKED: "bg-status-booked",
  WAITING: "bg-status-waiting",
  IN_CONSULTATION: "bg-status-in-consultation",
  COMPLETED: "bg-status-completed",
  CANCELLED: "bg-status-cancelled",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status
  const tone = statusToneMap[status] || "neutral"

  return (
    <UiStatusBadge
      tone={tone}
      className={`${statusColour[status] ?? ""} rounded-full border-transparent px-2.5 font-semibold text-on-primary ${className ?? ""}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </UiStatusBadge>
  )
}
