import { useState } from "react"
import { Link } from "react-router-dom"
import type { StaffAppointment, Status } from "@/models"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatClinicTime } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from "@/utils/status"
import { useSetAppointmentStatusMutation } from "@/services/endpoints/appointments"
import { announce } from "@/components/shared/live-region"
import { isProblem, type ApiError } from "@/services/httpClient/apiError"
import { Clock, ArrowRight, AlertCircle, X } from "lucide-react"

export type AppointmentTableProps = {
  appointments: StaffAppointment[]
  date: string
  hasFilters?: boolean
  onClearFilters?: () => void
  listArgs?: {
    date: string
    status?: string
    q?: string
    page?: number
    size?: number
  }
}

export function AppointmentTable({
  appointments,
  date,
  hasFilters = false,
  onClearFilters,
  listArgs,
}: AppointmentTableProps) {
  const [setStatus, { isLoading: isUpdatingStatus }] = useSetAppointmentStatusMutation()

  // State for cancel confirmation dialog
  const [cancellingAppt, setCancellingAppt] = useState<StaffAppointment | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  // State for stale / conflict notice
  const [conflictNotice, setConflictNotice] = useState<string | null>(null)

  // Visual feedback only: which row just changed, and a "+1 waiting" float after a confirmed check-in.
  const [justChangedId, setJustChangedId] = useState<string | null>(null)
  const [floatKey, setFloatKey] = useState(0)
  function flagChanged(id: string) {
    setJustChangedId(id)
    window.setTimeout(() => setJustChangedId((cur) => (cur === id ? null : cur)), 1000)
  }

  async function handleTransition(appt: StaffAppointment, targetStatus: Status) {
    if (targetStatus === "CANCELLED") {
      setCancellingAppt(appt)
      setCancelReason("")
      return
    }

    setConflictNotice(null)
    flagChanged(appt.id)
    try {
      await setStatus({
        id: appt.id,
        date,
        listArgs,
        body: {
          status: targetStatus,
          expectedStatus: appt.status,
        },
      }).unwrap()

      announce(`${appt.patientName} is now ${STATUS_LABELS[targetStatus] ?? targetStatus}.`)
      if (targetStatus === "WAITING") setFloatKey((k) => k + 1)
    } catch (err) {
      const error = err as ApiError
      if (isProblem(error, "STALE_STATE") || isProblem(error, "INVALID_TRANSITION")) {
        const current = error.problem.current as StaffAppointment | undefined
        const currentLabel = current ? STATUS_LABELS[current.status] ?? current.status : "another status"
        const notice = `${appt.patientName} was already changed to ${currentLabel} by someone else. The row now shows the current status.`
        setConflictNotice(notice)
        announce(notice)
        flagChanged(appt.id)
      } else {
        setConflictNotice("Could not update appointment status. Please try again.")
      }
    }
  }

  async function confirmCancellation() {
    if (!cancellingAppt) return

    setConflictNotice(null)
    try {
      await setStatus({
        id: cancellingAppt.id,
        date,
        listArgs,
        body: {
          status: "CANCELLED",
          expectedStatus: cancellingAppt.status,
          reason: cancelReason.trim() || undefined,
        },
      }).unwrap()

      announce(`${cancellingAppt.patientName} appointment was cancelled.`)
      setCancellingAppt(null)
      setCancelReason("")
    } catch (err) {
      const error = err as ApiError
      if (isProblem(error, "STALE_STATE")) {
        const notice = `${cancellingAppt.patientName} was already updated by another staff member.`
        setConflictNotice(notice)
        announce(notice)
      } else {
        setConflictNotice("Failed to cancel appointment. Please retry.")
      }
      setCancellingAppt(null)
    }
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title={hasFilters ? "No appointments match these filters" : "No appointments for this date"}
        description={
          hasFilters
            ? "Try broadening your search or clearing the status and search filters."
            : "No appointments have been booked or admitted as walk-ins for this date."
        }
        action={
          hasFilters && onClearFilters
            ? { label: "Clear all filters", onClick: onClearFilters }
            : undefined
        }
        className="my-6 border border-dashed border-[var(--color-border)] rounded-[var(--radius)] p-10 bg-[var(--color-surface)]"
      />
    )
  }

  return (
    <div className="relative space-y-4">
      {floatKey > 0 && (
        <span
          key={floatKey}
          aria-hidden="true"
          className="cf-floatup pointer-events-none absolute -top-9 right-2 z-10 rounded-full bg-accent px-3 py-0.5 font-heading text-sm font-extrabold text-on-accent"
        >
          +1 waiting
        </span>
      )}
      {/* Conflict / Stale State Alert Banner */}
      {conflictNotice && (
        <div
          role="alert"
          className="cf-slide p-3.5 bg-warning-bg border border-warning/40 rounded-2xl text-sm text-text flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 text-warning shrink-0 mt-0.5" />
            <span className="font-medium">{conflictNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setConflictNotice(null)}
            className="text-muted hover:text-text p-0.5"
            aria-label="Dismiss notice"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-muted font-semibold">
              <th scope="col" className="py-3 px-4">Time / Slot</th>
              <th scope="col" className="py-3 px-4">Reference</th>
              <th scope="col" className="py-3 px-4">Patient Name</th>
              <th scope="col" className="py-3 px-4">Contact</th>
              <th scope="col" className="py-3 px-4">Visit Type</th>
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {appointments.map((appt) => {
              const timeDisplay = appt.isWalkIn
                ? "Walk-in"
                : appt.slot
                  ? formatClinicTime(appt.slot.startsAt)
                  : "—"

              const allowedActions = ALLOWED_TRANSITIONS[appt.status] || []

              return (
                <tr key={appt.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-text whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted" />
                      <span>{timeDisplay}</span>
                      {appt.isWalkIn && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                          Walk-in
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                    {appt.reference}
                  </td>
                  <td className="py-3 px-4 font-semibold text-text max-w-[180px] break-words">
                    {appt.patientName}
                  </td>
                  <td className="py-3 px-4 text-muted max-w-[140px] truncate" title={appt.contact}>
                    {appt.contact}
                  </td>
                  <td className="py-3 px-4 text-text whitespace-nowrap">
                    {appt.visitType.label}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge key={`${appt.id}-${appt.status}`} status={appt.status} className={justChangedId === appt.id ? "cf-glow" : undefined} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {allowedActions.map((action) => (
                        <Button
                          key={action.targetStatus}
                          variant={action.variant || "secondary"}
                          size="sm"
                          disabled={isUpdatingStatus}
                          onClick={() => handleTransition(appt, action.targetStatus)}
                          className="text-xs h-7 px-2.5 font-medium"
                        >
                          {action.label}
                        </Button>
                      ))}

                      <Link
                        to={routes.staff.appointment(appt.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-control border border-border hover:bg-surface-hover text-text transition-colors"
                      >
                        Detail
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden space-y-3">
        {appointments.map((appt) => {
          const timeDisplay = appt.isWalkIn
            ? "Walk-in"
            : appt.slot
              ? formatClinicTime(appt.slot.startsAt)
              : "—"

          const allowedActions = ALLOWED_TRANSITIONS[appt.status] || []

          return (
            <div
              key={appt.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{appt.reference}</span>
                <StatusBadge key={`${appt.id}-${appt.status}`} status={appt.status} className={justChangedId === appt.id ? "cf-glow" : undefined} />
              </div>

              <div>
                <h4 className="font-semibold text-text text-sm break-words">{appt.patientName}</h4>
                <div className="flex items-center gap-2 text-xs text-muted mt-1">
                  <span>{timeDisplay}</span>
                  <span>•</span>
                  <span>{appt.visitType.label}</span>
                  <span>•</span>
                  <span>{appt.contact}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {allowedActions.map((action) => (
                    <Button
                      key={action.targetStatus}
                      variant={action.variant || "secondary"}
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleTransition(appt, action.targetStatus)}
                      className="text-xs h-7 px-2.5"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                <Link
                  to={routes.staff.appointment(appt.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
                >
                  Detail
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={Boolean(cancellingAppt)}
        onOpenChange={(open) => {
          if (!open) setCancellingAppt(null)
        }}
        title="Cancel Appointment"
        description={
          cancellingAppt ? (
            <span>
              Are you sure you want to cancel the booking for{" "}
              <strong className="text-[var(--color-text)]">{cancellingAppt.patientName}</strong> (
              <span className="font-mono text-primary">{cancellingAppt.reference}</span>)? This will release
              their slot in the clinic calendar.
            </span>
          ) : (
            ""
          )
        }
        footer={
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancellingAppt(null)}
            >
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmCancellation}
              loading={isUpdatingStatus}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-1 py-2">
          <label htmlFor="appt-cancel-reason" className="text-xs font-semibold text-[var(--color-text)] block">
            Reason for cancellation (optional):
          </label>
          <Textarea
            id="appt-cancel-reason"
            placeholder="e.g. Patient called to cancel / No show"
            maxLength={200}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
          />
        </div>
      </Dialog>
    </div>
  )
}
