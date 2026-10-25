import { useState } from "react"
import { Link } from "react-router-dom"
import type { QueueView, StaffAppointment, Status } from "@/models"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatClinicTime } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import { useSetAppointmentStatusMutation } from "@/services/endpoints/appointments"
import { announce } from "@/components/shared/live-region"
import type { ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { Stethoscope, Clock, CheckCircle, Play, Ban, AlertCircle, ArrowRight } from "lucide-react"

export type QueueBoardProps = {
  queue: QueueView
  date: string
}

export function QueueBoard({ queue, date }: QueueBoardProps) {
  const [setStatus, { isLoading: isUpdating }] = useSetAppointmentStatusMutation()
  const [actionError, setActionError] = useState<ApiError | null>(null)

  // Cancel modal state
  const [cancellingAppt, setCancellingAppt] = useState<StaffAppointment | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  const inConsultation = queue.inConsultation || []
  const waiting = queue.waiting || []
  const updatedTime = queue.generatedAt ? formatClinicTime(queue.generatedAt) : null

  async function handleStatusChange(
    appt: StaffAppointment,
    targetStatus: Status,
    reason?: string,
  ) {
    setActionError(null)
    try {
      await setStatus({
        id: appt.id,
        date,
        body: {
          status: targetStatus,
          expectedStatus: appt.status,
          reason,
        },
      }).unwrap()

      announce(`Appointment status changed to ${targetStatus}.`)
      setCancellingAppt(null)
      setCancelReason("")
    } catch (err) {
      const error = err as ApiError
      setActionError(error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Freshness banner */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>Live Queue Board</span>
        {updatedTime && <span>Updated {updatedTime} (Africa/Lagos)</span>}
      </div>

      {actionError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-control text-xs text-danger flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{getErrorMessage(actionError)}</p>
            {actionError.kind === "problem" && Boolean(actionError.problem.current) && (
              <p className="text-[11px] text-muted">
                Server status is: {(actionError.problem.current as StaffAppointment).status}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 1. Currently in Consultation Section */}
      <section aria-labelledby="in-consultation-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-purple-600" />
          <h2 id="in-consultation-heading" className="text-sm font-bold text-text uppercase tracking-wider">
            In Consultation ({inConsultation.length})
          </h2>
        </div>

        {inConsultation.length === 0 ? (
          <EmptyState
            title="No Active Consultation"
            description="No patient currently in consultation. Ready to call the next waiting patient."
            className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-6 bg-[var(--color-surface)]"
          />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {inConsultation.map((appt) => (
              <div
                key={appt.id}
                className="rounded-[var(--radius-card)] border border-purple-200/80 bg-purple-50/60 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary block">
                      {appt.reference}
                    </span>
                    <h3 className="font-bold text-base text-text break-words">
                      {appt.patientName}
                    </h3>
                  </div>
                  <StatusBadge status="IN_CONSULTATION" />
                </div>

                <div className="text-xs text-muted space-y-1">
                  <p>
                    <span className="font-medium text-text">Reason:</span> {appt.visitType.label}
                  </p>
                  {appt.consultationStartedAt && (
                    <p>
                      <span className="font-medium text-text">Started:</span>{" "}
                      {formatClinicTime(appt.consultationStartedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                  <Link
                    to={routes.staff.appointment(appt.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View details
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(appt, "COMPLETED")}
                    loading={isUpdating}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="size-3.5 mr-1.5" />
                    Complete Visit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Waiting in Queue Section */}
      <section aria-labelledby="waiting-queue-heading" className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-amber-600" />
          <h2 id="waiting-queue-heading" className="text-sm font-bold text-text uppercase tracking-wider">
            Waiting in Queue ({waiting.length})
          </h2>
        </div>

        {waiting.length === 0 ? (
          <EmptyState
            title="Waiting Queue is Empty"
            description="The queue is currently clear. No patients are waiting."
            className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-8 bg-[var(--color-surface)]"
          />
        ) : (
          <div className="space-y-3">
            {waiting.map((appt, idx) => {
              const position = appt.queuePosition || idx + 1
              const isNext = position === 1

              return (
                <div
                  key={appt.id}
                  className={`rounded-[var(--radius-card)] border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isNext
                      ? "bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300/80"
                      : "bg-surface border-border hover:bg-surface-hover/80 shadow-2xs hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Position Badge */}
                    <div
                      className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isNext
                          ? "bg-amber-500 text-on-primary shadow-xs"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}
                    >
                      #{position}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {appt.reference}
                        </span>
                        {appt.isWalkIn && (
                          <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            Walk-in
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                            Next
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-text break-words">
                        {appt.patientName}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {appt.visitType.label} • Checked in at{" "}
                        {appt.checkedInAt ? formatClinicTime(appt.checkedInAt) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCancellingAppt(appt)}
                      disabled={isUpdating}
                      className="text-xs text-danger hover:bg-red-50"
                      aria-label={`Cancel appointment for ${appt.patientName}`}
                    >
                      <Ban className="size-3.5 mr-1" />
                      Cancel
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(appt, "IN_CONSULTATION")}
                      loading={isUpdating}
                      disabled={isUpdating}
                      className="text-xs"
                    >
                      <Play className="size-3.5 mr-1" />
                      Start Consultation
                    </Button>

                    <Link
                      to={routes.staff.appointment(appt.id)}
                      className="p-1.5 text-muted hover:text-text rounded-control border border-border"
                      aria-label="View appointment details"
                    >
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Cancel Reason Modal */}
      <Dialog
        open={Boolean(cancellingAppt)}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingAppt(null)
            setCancelReason("")
          }
        }}
        title={`Cancel Appointment — ${cancellingAppt?.patientName ?? ""}`}
        description="Cancelling this patient will remove them from the queue and move all waiting patients behind them up one position."
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCancellingAppt(null)
                setCancelReason("")
              }}
            >
              Keep Waiting
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (cancellingAppt) {
                  handleStatusChange(cancellingAppt, "CANCELLED", cancelReason.trim() || undefined)
                }
              }}
              loading={isUpdating}
            >
              Confirm Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-1 py-2">
          <label htmlFor="queue-cancel-reason" className="text-xs font-semibold text-[var(--color-text)] block">
            Reason (Optional)
          </label>
          <Textarea
            id="queue-cancel-reason"
            placeholder="e.g. Left without being seen / Requested cancellation"
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
