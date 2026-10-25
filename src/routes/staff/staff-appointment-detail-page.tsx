import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import {
  useGetAppointmentQuery,
  useSetAppointmentStatusMutation,
  useListAppointmentActivityQuery,
} from "@/services/endpoints/appointments"
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from "@/utils/status"
import { formatClinicDate, formatClinicTime, clinicToday } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import type { Status, StaffAppointment } from "@/models"
import type { ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { announce } from "@/components/shared/live-region"
import { ArrowLeft, Clock, Calendar, User, Phone, CheckCircle, AlertCircle, History } from "lucide-react"

export function StaffAppointmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>()

  const { data: appointment, isLoading, isError, error, refetch } = useGetAppointmentQuery(id)
  const { data: activity = [], isLoading: isLoadingActivity } = useListAppointmentActivityQuery(id)

  const [setStatus, { isLoading: isUpdating }] = useSetAppointmentStatusMutation()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [actionError, setActionError] = useState<ApiError | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Appointment Detail" description="Loading appointment record…" />
        <div className="rounded-control border border-border bg-surface p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (isError || !appointment) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader title="Appointment Not Found" description="Could not load the requested record." />
        <div className="rounded-control border border-border bg-surface p-6 text-center space-y-3">
          <p className="text-sm text-danger font-medium">
            {getErrorMessage(error)}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
            <Link to={routes.staff.appointments} className="px-3 py-1.5 text-xs border rounded-control">
              Return to appointments list
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const allowedActions = ALLOWED_TRANSITIONS[appointment.status] || []
  const appointmentDate = appointment.slot
    ? appointment.slot.startsAt.slice(0, 10)
    : clinicToday()

  async function handleStatusTransition(targetStatus: Status, reason?: string) {
    setActionError(null)
    try {
      await setStatus({
        id,
        date: appointmentDate,
        body: {
          status: targetStatus,
          expectedStatus: appointment!.status,
          reason,
        },
      }).unwrap()

      announce(`Status updated to ${STATUS_LABELS[targetStatus]}.`)
      setShowCancelModal(false)
      setCancelReason("")
    } catch (err) {
      const errObj = err as ApiError
      setActionError(errObj)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={routes.staff.appointments}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Back to Appointments
        </Link>
        <span className="text-xs text-muted">Record Version: {appointment.version}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-sm text-primary font-bold block">{appointment.reference}</span>
          <h1 className="text-2xl font-bold text-text break-words">{appointment.patientName}</h1>
        </div>
        <StatusBadge status={appointment.status} className="self-start sm:self-auto text-sm px-3 py-1" />
      </div>

      {actionError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-control text-xs text-danger flex items-start gap-3">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{getErrorMessage(actionError)}</p>
            {actionError.kind === "problem" && Boolean(actionError.problem.current) && (
              <p className="text-[11px] text-muted mt-1">
                True current status: {(actionError.problem.current as StaffAppointment).status}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <Card className="p-6 shadow-xs space-y-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-muted block flex items-center gap-1">
              <User className="size-3.5" /> Patient Name
            </span>
            <span className="font-semibold text-text break-words">{appointment.patientName}</span>
          </div>

          <div>
            <span className="text-xs text-muted block flex items-center gap-1">
              <Phone className="size-3.5" /> Contact
            </span>
            <span className="font-medium text-text">{appointment.contact}</span>
          </div>

          <div>
            <span className="text-xs text-muted block">Visit Reason</span>
            <span className="font-medium text-text">
              {appointment.visitType.label} ({appointment.visitType.durationMinutes} min)
            </span>
          </div>

          <div>
            <span className="text-xs text-muted block flex items-center gap-1">
              <Calendar className="size-3.5" /> Date & Time
            </span>
            <span className="font-medium text-text">
              {appointment.isWalkIn
                ? "Walk-in Admission"
                : appointment.slot
                  ? `${formatClinicDate(appointment.slot.startsAt)} at ${formatClinicTime(appointment.slot.startsAt)}`
                  : "Unassigned"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted block flex items-center gap-1">
              <Clock className="size-3.5" /> Queue Status
            </span>
            <span className="font-medium text-text">
              {appointment.queuePosition
                ? `Position #${appointment.queuePosition} in queue`
                : "Not currently in waiting queue"}
            </span>
          </div>

          <div>
            <span className="text-xs text-muted block">Admission Type</span>
            <span className="font-medium text-text">
              {appointment.isWalkIn ? "Walk-In" : "Scheduled Slot"}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-4 border-t border-border grid sm:grid-cols-3 gap-3 text-xs text-muted">
          <div>
            <span className="block font-medium text-text">Checked In</span>
            {appointment.checkedInAt ? formatClinicTime(appointment.checkedInAt) : "—"}
          </div>
          <div>
            <span className="block font-medium text-text">Consultation Started</span>
            {appointment.consultationStartedAt ? formatClinicTime(appointment.consultationStartedAt) : "—"}
          </div>
          <div>
            <span className="block font-medium text-text">Completed</span>
            {appointment.completedAt ? formatClinicTime(appointment.completedAt) : "—"}
          </div>
        </div>

        {appointment.cancelReason && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-control text-xs">
            <span className="font-semibold text-text block">Cancellation Reason:</span>
            <p className="text-muted mt-0.5">{appointment.cancelReason}</p>
          </div>
        )}

        {/* Action Controls */}
        {allowedActions.length > 0 && (
          <div className="pt-4 border-t border-border flex flex-wrap gap-3">
            {allowedActions.map((act) => {
              if (act.targetStatus === "CANCELLED") {
                return (
                  <Button
                    key={act.targetStatus}
                    variant="danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                    disabled={isUpdating}
                  >
                    Cancel Appointment
                  </Button>
                )
              }

              return (
                <Button
                  key={act.targetStatus}
                  variant={act.variant || "primary"}
                  size="sm"
                  onClick={() => handleStatusTransition(act.targetStatus)}
                  loading={isUpdating}
                  disabled={isUpdating}
                >
                  <CheckCircle className="size-3.5 mr-1.5" />
                  {act.label}
                </Button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCancelModal(false)
            setCancelReason("")
          }
        }}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? This action cannot be undone."
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCancelModal(false)
                setCancelReason("")
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusTransition("CANCELLED", cancelReason.trim() || undefined)}
              loading={isUpdating}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-1 py-2">
          <label htmlFor="staff-cancel-reason" className="text-xs font-medium text-[var(--color-text)] block">
            Reason for Cancellation (Optional)
          </label>
          <Textarea
            id="staff-cancel-reason"
            placeholder="e.g. Patient called to cancel / No show"
            maxLength={200}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
          />
        </div>
      </Dialog>

      {/* Activity Timeline */}
      <Card className="p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-text flex items-center gap-2">
          <History className="size-4 text-muted" />
          Appointment Activity History
        </h2>

        {isLoadingActivity ? (
          <p className="text-xs text-muted">Loading activity timeline…</p>
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted">No activity entries recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200">
            {activity.map((entry) => (
              <div key={entry.id} className="relative text-xs space-y-1">
                <span className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-primary border-2 border-white ring-1 ring-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{entry.eventType.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-muted">
                    {formatClinicDate(entry.occurredAt)} at {formatClinicTime(entry.occurredAt)}
                  </span>
                </div>
                <p className="text-muted">
                  By: <span className="font-medium text-text">{entry.actor}</span> ({entry.actorRole})
                  {entry.toStatus && ` → Status: ${entry.toStatus}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default StaffAppointmentDetailPage
