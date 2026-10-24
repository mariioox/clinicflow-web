import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { SlotPicker } from "@/modules/booking/slot-picker"
import { SlotTakenPanel } from "@/modules/booking/slot-taken-panel"

import {
  useGetPatientAppointmentQuery,
  useCancelPatientAppointmentMutation,
  useReschedulePatientAppointmentMutation,
} from "@/services/endpoints/patient"
import { useListSlotsQuery } from "@/services/endpoints/slots"
import { clinicToday, getBookingHorizonDates, formatClinicDate, formatClinicTime } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import type { Slot } from "@/models"
import { isProblem, type ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { announce } from "@/components/shared/live-region"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export function ManagePage() {
  const { reference = "" } = useParams<{ reference: string }>()

  const { data: appointment, isLoading, isError, error, refetch } =
    useGetPatientAppointmentQuery(reference)

  const [activeTab, setActiveTab] = useState<"details" | "cancel" | "reschedule">("details")
  const [manageToken, setManageToken] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<ApiError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reschedule state
  const horizon = getBookingHorizonDates(14)
  const [rescheduleDate, setRescheduleDate] = useState(() => clinicToday())
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const { data: slots = [], isLoading: isLoadingSlots } = useListSlotsQuery(rescheduleDate)

  const [cancelAppointment, { isLoading: isCancelling }] = useCancelPatientAppointmentMutation()
  const [rescheduleAppointment, { isLoading: isRescheduling }] = useReschedulePatientAppointmentMutation()

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader title="Manage Booking" description="Loading appointment details…" />
        <div className="rounded-control border border-border bg-surface p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (isError || !appointment) {
    const apiError = error as ApiError
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader title="Manage Booking" description="Unable to load booking details." />
        <Card className="p-6 text-center space-y-4">
          <ErrorState
            title="Unable to load booking"
            description={getErrorMessage(apiError)}
            onRetry={() => refetch()}
          />
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to={routes.home}
              className="px-4 py-2 text-xs border border-[var(--color-border)] rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
            >
              Back to Home
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isBooked = appointment.status === "BOOKED"

  async function handleCancelSubmit() {
    if (!manageToken.trim()) {
      setTokenError("Please enter your manage token to confirm cancellation")
      return
    }

    setTokenError(null)
    setActionError(null)

    try {
      await cancelAppointment({
        reference,
        manageToken: manageToken.trim(),
        body: cancelReason.trim() ? { reason: cancelReason.trim() } : {},
      }).unwrap()

      setSuccessMessage("Your appointment has been successfully cancelled.")
      announce("Appointment cancelled successfully.")
      setActiveTab("details")
    } catch (err) {
      const errObj = err as ApiError
      if (isProblem(errObj, "UNAUTHENTICATED")) {
        setTokenError("That manage token does not match this booking. Please check and try again.")
      } else {
        setActionError(errObj)
      }
    }
  }

  async function handleRescheduleSubmit() {
    if (!manageToken.trim()) {
      setTokenError("Please enter your manage token to confirm reschedule")
      return
    }
    if (!selectedSlotId) {
      setActionError({
        kind: "problem",
        status: 400,
        problem: {
          code: "VALIDATION_FAILED",
          title: "Slot required",
          status: 400,
          requestId: crypto.randomUUID(),
          detail: "Please choose a new time slot from the list.",
        },
      })
      return
    }

    setTokenError(null)
    setActionError(null)

    try {
      await rescheduleAppointment({
        reference,
        manageToken: manageToken.trim(),
        body: { slotId: selectedSlotId },
      }).unwrap()

      setSuccessMessage("Your appointment has been successfully rescheduled.")
      announce("Appointment rescheduled successfully.")
      setActiveTab("details")
      setSelectedSlotId(null)
    } catch (err) {
      const errObj = err as ApiError
      if (isProblem(errObj, "UNAUTHENTICATED")) {
        setTokenError("That manage token does not match this booking. Please check and try again.")
      } else {
        setActionError(errObj)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={routes.trackRef(reference)}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium"
        >
          <ArrowLeft className="size-3.5" />
          View Live Queue Track
        </Link>
      </div>

      <PageHeader
        title={`Manage Booking — ${reference}`}
        description="Cancel or change your scheduled appointment time."
      />

      {successMessage && (
        <div role="status" className="p-4 bg-green-50 border border-green-200 rounded-control flex items-start gap-3">
          <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">{successMessage}</p>
            <p className="text-xs text-green-800 mt-0.5">The clinic records have been updated.</p>
          </div>
        </div>
      )}

      {/* Appointment Snapshot Card */}
      <Card className="p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">Patient</span>
            <span className="font-semibold text-[var(--color-text)] text-base break-words">{appointment.patientName}</span>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs bg-[var(--color-bg)] p-4 rounded-[var(--radius)] border border-[var(--color-border)]">
          <div>
            <span className="text-[var(--color-text-muted)] block">Visit Type</span>
            <span className="font-medium text-[var(--color-text)]">{appointment.visitType.label}</span>
          </div>
          {appointment.slot && (
            <div>
              <span className="text-[var(--color-text-muted)] block">Scheduled Time</span>
              <span className="font-medium text-[var(--color-text)]">
                {formatClinicDate(appointment.slot.startsAt)} at {formatClinicTime(appointment.slot.startsAt)}
              </span>
            </div>
          )}
        </div>

        {!isBooked && (
          <div className="p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius)] text-xs text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)]">Online changes are not available for this status.</p>
            <p className="mt-1">
              Once an appointment is checked in, in consultation, completed or cancelled, changes must be handled in person with clinic reception.
            </p>
          </div>
        )}

        {isBooked && (
          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant={activeTab === "details" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setActiveTab("details")
                setActionError(null)
                setTokenError(null)
              }}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "reschedule" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setActiveTab("reschedule")
                setActionError(null)
                setTokenError(null)
              }}
            >
              Reschedule Visit
            </Button>
            <Button
              variant={activeTab === "cancel" ? "danger" : "secondary"}
              size="sm"
              onClick={() => {
                setActiveTab("cancel")
                setActionError(null)
                setTokenError(null)
              }}
            >
              Cancel Visit
            </Button>
          </div>
        )}
      </Card>

      {/* Reschedule Tab */}
      {isBooked && activeTab === "reschedule" && (
        <Card className="p-6 shadow-xs space-y-6">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Choose a New Date & Slot</h3>

          {/* Manage Token Input */}
          <div className="space-y-1.5">
            <label htmlFor="reschedule-manage-token" className="block text-sm font-medium text-text">
              Enter Your Manage Token <span className="text-danger">*</span>
            </label>
            <Input
              id="reschedule-manage-token"
              type="text"
              placeholder="Paste the manage token from your booking confirmation"
              value={manageToken}
              onChange={(e) => {
                setManageToken(e.target.value)
                if (tokenError) setTokenError(null)
              }}
              aria-invalid={!!tokenError}
              className="font-mono text-sm"
            />
            {tokenError && <p className="text-xs text-danger font-medium">{tokenError}</p>}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text">Select New Date</span>
            <div className="flex flex-wrap gap-2">
              {horizon.slice(0, 7).map((h) => (
                <button
                  key={h.date}
                  type="button"
                  onClick={() => {
                    setRescheduleDate(h.date)
                    setSelectedSlotId(null)
                  }}
                  className={`px-3 py-1.5 rounded-control text-xs font-medium border ${
                    h.date === rescheduleDate
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface border-border text-text hover:bg-surface-hover"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slot Picker */}
          <SlotPicker
            slots={slots}
            selectedSlotId={selectedSlotId}
            onSelectSlot={(id) => setSelectedSlotId(id)}
            isLoading={isLoadingSlots}
            isSunday={horizon.find((h) => h.date === rescheduleDate)?.isSunday}
          />

          {actionError && isProblem(actionError, "SLOT_TAKEN") && (
            <SlotTakenPanel
              suggestedSlots={((actionError.problem.suggestedSlots as unknown) as Slot[]) || []}
              onSelectSuggested={(id) => {
                setSelectedSlotId(id)
                setActionError(null)
              }}
            />
          )}

          {actionError && !isProblem(actionError, "SLOT_TAKEN") && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-control text-xs text-danger">
              <p className="font-semibold">{getErrorMessage(actionError)}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setActiveTab("details")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRescheduleSubmit}
              loading={isRescheduling}
              disabled={isRescheduling || !selectedSlotId}
            >
              Confirm New Slot
            </Button>
          </div>
        </Card>
      )}

      {/* Cancel Tab */}
      {isBooked && activeTab === "cancel" && (
        <Card className="p-6 shadow-xs space-y-6 border-danger/30">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-danger">Cancel Appointment</h3>
            <p className="text-xs text-muted">
              Are you sure you want to cancel this booking? This will free your slot for another patient.
            </p>
          </div>

          {/* Manage Token Input */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-manage-token" className="block text-sm font-medium text-text">
              Enter Your Manage Token <span className="text-danger">*</span>
            </label>
            <Input
              id="cancel-manage-token"
              type="text"
              placeholder="Paste your manage token to authenticate cancellation"
              value={manageToken}
              onChange={(e) => {
                setManageToken(e.target.value)
                if (tokenError) setTokenError(null)
              }}
              aria-invalid={!!tokenError}
              className="font-mono text-sm"
            />
            {tokenError && <p className="text-xs text-danger font-medium">{tokenError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-text">
              Cancellation Reason (Optional)
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="Optional brief explanation (max 200 characters)"
              maxLength={200}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
            />
          </div>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-control text-xs text-danger">
              <p className="font-semibold">{getErrorMessage(actionError)}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setActiveTab("details")}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelSubmit}
              loading={isCancelling}
              disabled={isCancelling}
            >
              Confirm Cancellation
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ManagePage
