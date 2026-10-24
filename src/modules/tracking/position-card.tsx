import { Link } from "react-router-dom"
import type { PatientAppointment } from "@/models"
import { StatusBadge } from "@/components/shared/status-badge"
import { EstimateText } from "@/components/shared/estimate-text"
import { MetaField } from "@/components/ui/meta-field"
import { Card } from "@/components/ui/card"
import { formatClinicDate, formatClinicTime } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import { Radio, RefreshCw, Clock, Info } from "lucide-react"

export type PositionCardProps = {
  appointment: PatientAppointment
  reconnecting?: boolean
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function PositionCard({
  appointment,
  reconnecting = false,
}: PositionCardProps) {
  const {
    reference,
    patientName,
    visitType,
    slot,
    status,
    queuePosition,
    peopleAhead,
    estimate,
    canCancel,
    canReschedule,
    updatedAt,
  } = appointment

  const updatedTime = updatedAt ? formatClinicTime(updatedAt) : null

  return (
    <Card className="p-6 sm:p-8 space-y-6 shadow-xs border-[var(--color-border)]">
      {/* Top Bar: Reference + Status + Live indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <span className="text-xs text-[var(--color-text-muted)] block">Booking Reference</span>
          <span className="font-mono text-xl font-bold text-primary tracking-wide">{reference}</span>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />

          {/* Connection state */}
          {status !== "COMPLETED" && status !== "CANCELLED" && (
            <div className="flex items-center gap-1.5 text-xs">
              {reconnecting ? (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium animate-pulse">
                  <RefreshCw className="size-3 animate-spin" />
                  Reconnecting…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  <Radio className="size-3 text-primary animate-pulse" />
                  Live updates
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Position / Status Display: 3 Core Questions Answered */}
      {status === "WAITING" && queuePosition !== null && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-[var(--radius)] p-6 text-center space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Current Queue Position
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-[var(--color-text)]">
            {queuePosition === 1 ? "Next in line" : `#${queuePosition} (${getOrdinal(queuePosition)}) in queue`}
          </div>

          <p className="text-sm text-[var(--color-text-muted)] font-medium">
            {peopleAhead === 0
              ? "You are next to be seen by the clinic practitioner!"
              : `${peopleAhead} ${peopleAhead === 1 ? "consultation" : "consultations"} ahead of you`}
          </p>

          {/* Action Instruction */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-900">
            <Info className="size-3.5 text-amber-700" />
            <span>Please remain seated in the waiting area. Your name will be called next.</span>
          </div>

          {estimate && (
            <div className="pt-3 border-t border-amber-200 max-w-sm mx-auto">
              <EstimateText estimate={estimate} className="text-center" />
            </div>
          )}
        </div>
      )}

      {status === "BOOKED" && (
        <div className="bg-sky-50 border border-sky-200 rounded-[var(--radius)] p-6 text-center space-y-3">
          <h3 className="text-lg font-bold text-sky-950">Not Yet Arrived</h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
            Please check in with the reception desk upon your arrival at the clinic. Your queue position will activate once checked in.
          </p>
          {slot && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[var(--color-border)] rounded-full text-xs font-medium text-[var(--color-text)] mt-2 shadow-2xs">
              <Clock className="size-3.5 text-primary" />
              <span>Scheduled Slot: {formatClinicTime(slot.startsAt)} on {formatClinicDate(slot.startsAt)}</span>
            </div>
          )}
        </div>
      )}

      {status === "IN_CONSULTATION" && (
        <div className="bg-purple-50 border border-purple-200 rounded-[var(--radius)] p-6 text-center space-y-2">
          <h3 className="text-xl font-bold text-purple-950">In Consultation</h3>
          <p className="text-sm text-purple-900">
            You are currently in consultation with the clinic practitioner.
          </p>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] p-6 text-center space-y-2">
          <h3 className="text-xl font-bold text-emerald-950">Visit Completed</h3>
          <p className="text-sm text-emerald-900">
            Your consultation has concluded. Thank you for visiting Demo Community Clinic!
          </p>
        </div>
      )}

      {status === "CANCELLED" && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-6 text-center space-y-2">
          <h3 className="text-xl font-bold text-[var(--color-text)]">Appointment Cancelled</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            This booking has been cancelled and is no longer active in the queue.
          </p>
        </div>
      )}

      {/* Appointment Information Details */}
      <div className="grid sm:grid-cols-2 gap-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] p-5">
        <MetaField label="Patient" value={patientName} />
        <MetaField label="Visit Reason" value={visitType.label} />
        {slot && (
          <MetaField
            label="Scheduled Slot"
            value={`${formatClinicDate(slot.startsAt)} (${formatClinicTime(slot.startsAt)} - ${formatClinicTime(slot.endsAt)})`}
          />
        )}
        {updatedTime && (
          <MetaField label="Last Updated" value={`${updatedTime} (Africa/Lagos)`} />
        )}
      </div>

      {/* Manage Links */}
      {(canCancel || canReschedule) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            Need to change or cancel? You will need your manage token.
          </p>
          <Link
            to={routes.manageRef(reference)}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-sm font-semibold text-[var(--color-text)] w-full sm:w-auto transition-colors"
          >
            Manage Booking
          </Link>
        </div>
      )}
    </Card>
  )
}
