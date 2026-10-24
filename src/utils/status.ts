import type { Status } from "@/models"

export const STATUS_LABELS: Record<Status, string> = {
  BOOKED: "Booked",
  WAITING: "Waiting",
  IN_CONSULTATION: "In consultation",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

export type StatusAction = {
  targetStatus: Status
  label: string
  variant?: "primary" | "secondary" | "danger"
}

export const ALLOWED_TRANSITIONS: Record<Status, StatusAction[]> = {
  BOOKED: [
    { targetStatus: "WAITING", label: "Check in", variant: "primary" },
    { targetStatus: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  WAITING: [
    { targetStatus: "IN_CONSULTATION", label: "Start consultation", variant: "primary" },
    { targetStatus: "CANCELLED", label: "Cancel", variant: "danger" },
  ],
  IN_CONSULTATION: [
    { targetStatus: "COMPLETED", label: "Complete consultation", variant: "primary" },
  ],
  COMPLETED: [],
  CANCELLED: [],
}

export function canReschedule(status: Status): boolean {
  return status === "BOOKED"
}

export function canCancel(status: Status): boolean {
  return status === "BOOKED" || status === "WAITING"
}
