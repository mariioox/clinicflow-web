import { useState } from "react"
import { useFormik } from "formik"
import { AlertCircle, ArrowRight } from "lucide-react"
import { FormikInput } from "@/components/shared/formik-input"
import { FormikSelect } from "@/components/shared/formik-select"
import { RollingDigits } from "@/components/shared/rolling-digits"
import { SlotPicker } from "@/modules/booking/slot-picker"
import { SlotTakenPanel } from "@/modules/booking/slot-taken-panel"
import { BookingConfirmation } from "@/modules/booking/booking-confirmation"

import { useGetMetaQuery, useListVisitTypesQuery } from "@/services/endpoints/meta"
import { useListSlotsQuery } from "@/services/endpoints/slots"
import { useCreateAppointmentMutation } from "@/services/endpoints/patient"
import { useIdempotencyKey } from "@/hooks/use-idempotency-key"
import { bookingSchema, toFormikErrors } from "@/utils/schema"
import { CLINIC_TZ, clinicToday, formatClinicTime, getBookingHorizonDates } from "@/utils/clinicTime"
import type { ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import type { BookingCreated, Slot } from "@/models"
import { announce } from "@/components/shared/live-region"
import { cn } from "@/lib/utils"

const dowFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, weekday: "short" })
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, day: "2-digit" })
const monFmt = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TZ, month: "short" })
/** Midday UTC keeps the calendar date stable in Africa/Lagos (UTC+1). */
const atNoon = (date: string) => new Date(`${date}T12:00:00Z`)

export function BookPage() {
  const horizon = getBookingHorizonDates(14)
  const [selectedDate, setSelectedDate] = useState(() => clinicToday())
  const [confirmation, setConfirmed] = useState<BookingCreated | null>(null)
  const [suggestedSlots, setSuggestedSlots] = useState<Slot[]>([])
  const [lostSlot, setLostSlot] = useState<Slot | null>(null)
  const [justTakenIds, setJustTakenIds] = useState<string[]>([])
  const [generalError, setGeneralError] = useState<ApiError | null>(null)

  // One UUID per form, created when the form mounts, reused on every retry (see AGENT.md).
  const { key: idempotencyKey, renew: renewIdempotencyKey } = useIdempotencyKey()

  const { data: meta } = useGetMetaQuery()
  const { data: visitTypes = [], isLoading: isLoadingVisitTypes } = useListVisitTypesQuery()
  const { data: slots = [], isLoading: isLoadingSlots, refetch: refetchSlots } = useListSlotsQuery(selectedDate)
  const [createAppointment, { isLoading: isSubmitting }] = useCreateAppointmentMutation()

  const selectedDay = horizon.find((h) => h.date === selectedDate)
  const isSunday = selectedDay?.isSunday ?? false
  const nextOpenDay = horizon.find((h) => h.date > selectedDate && !h.isSunday)

  const formik = useFormik({
    initialValues: { patientName: "", contact: "", visitTypeCode: "", slotId: "" },
    validationSchema: bookingSchema,
    onSubmit: async (values) => {
      setGeneralError(null)
      try {
        const res = await createAppointment({
          idempotencyKey,
          date: selectedDate,
          body: {
            patientName: values.patientName,
            contact: values.contact,
            visitTypeCode: values.visitTypeCode,
            slotId: values.slotId,
          },
        }).unwrap()

        setConfirmed(res)
        renewIdempotencyKey()
        announce("Appointment confirmed. Your reference is " + res.appointment.reference)
      } catch (err) {
        const error = err as ApiError
        if (error.kind === "problem" && error.problem.code === "VALIDATION_FAILED") {
          formik.setErrors(toFormikErrors(error.problem))
          announce("Some details need fixing. Please check the highlighted fields.")
        } else if (error.kind === "problem" && error.problem.code === "SLOT_TAKEN") {
          const lost = slots.find((s) => s.id === values.slotId) ?? null
          const suggested = (error.problem.suggestedSlots as Slot[] | undefined) ?? []
          setLostSlot(lost)
          if (lost) setJustTakenIds((ids) => [...ids, lost.id])
          setSuggestedSlots(suggested)
          // Pre-select the nearest free time so one tap on Confirm recovers.
          formik.setFieldValue("slotId", suggested[0]?.id ?? "")
          refetchSlots()
          announce(
            `Sorry, ${lost ? formatClinicTime(lost.startsAt) : "that time"} was just booked by someone else. Nearby free times are listed.`,
          )
        } else {
          setGeneralError(error)
        }
      }
    },
  })

  function handleSlotSelect(slotId: string) {
    formik.setFieldValue("slotId", slotId)
  }

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate)
    formik.setFieldValue("slotId", "")
    setSuggestedSlots([])
    setLostSlot(null)
    setGeneralError(null)
  }

  function handleBookAnother() {
    setConfirmed(null)
    setSuggestedSlots([])
    setLostSlot(null)
    setJustTakenIds([])
    setGeneralError(null)
    formik.resetForm()
    renewIdempotencyKey()
  }

  if (confirmation) {
    return <BookingConfirmation confirmation={confirmation} onBookAnother={handleBookAnother} />
  }

  const visitTypeOptions = visitTypes.map((vt) => ({ value: vt.code, label: `${vt.label} (${vt.durationMinutes} min)` }))
  const chosenSlot = slots.find((s) => s.id === formik.values.slotId && s.available)
  const chosenType = visitTypes.find((vt) => vt.code === formik.values.visitTypeCode)
  const chosenTime = chosenSlot ? formatClinicTime(chosenSlot.startsAt) : "--:--"
  const dayLabel = `${dowFmt.format(atNoon(selectedDate))} ${dayFmt.format(atNoon(selectedDate))} ${monFmt.format(atNoon(selectedDate))}`
  const isNetworkError = generalError?.kind === "network"
  const clinicName = meta?.clinicName ?? "Demo Community Clinic (fictional)"

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1 className="max-w-3xl font-heading text-[2.6rem] font-extrabold leading-[0.95] tracking-[-0.045em] text-text min-[380px]:text-5xl sm:text-7xl">
          Book an{" "}
          <span className="inline-block rounded-[1.1rem] bg-primary px-4 pb-1.5 text-accent sm:rounded-[1.25rem]">appointment</span>
        </h1>
        <p className="max-w-sm text-muted">
          <strong className="text-text">{clinicName}</strong> · Outpatient consultations, Monday to Saturday, 08:00–16:00.
          You'll get a reference to follow your place in the queue.
        </p>
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_560px] space-y-5">
          <fieldset>
            <legend className="mb-2.5 font-heading text-xl font-extrabold text-text">
              Choose a day <span className="text-danger" aria-hidden="true">*</span>
            </legend>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
              {horizon.map((h) => {
                const on = h.date === selectedDate
                return (
                  <button
                    key={h.date}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${h.label}${h.isSunday ? ", closed" : ""}`}
                    onClick={() => handleDateChange(h.date)}
                    className={cn(
                      "cf-press cf-lift min-h-[84px] rounded-[1.25rem] border-2 p-2.5 text-left",
                      on && h.isSunday && "border-primary bg-soft text-text",
                      on && !h.isSunday && "border-primary bg-primary text-accent",
                      !on && h.isSunday && "border-dashed border-border-input bg-transparent text-muted",
                      !on && !h.isSunday && "border-border-input bg-surface text-text",
                    )}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wider">{dowFmt.format(atNoon(h.date))}</span>
                    <span className="block font-heading text-3xl font-extrabold leading-tight tracking-tight">
                      {dayFmt.format(atNoon(h.date))}
                    </span>
                    <span className="block text-xs">{h.isSunday ? "Closed" : on ? "Selected" : "Open"}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {suggestedSlots.length > 0 || lostSlot ? (
            <SlotTakenPanel
              suggestedSlots={suggestedSlots}
              lostSlot={lostSlot ?? undefined}
              selectedSlotId={formik.values.slotId}
              onSelectSuggested={handleSlotSelect}
            />
          ) : null}

          <SlotPicker
            slots={slots}
            selectedSlotId={formik.values.slotId}
            onSelectSlot={handleSlotSelect}
            isLoading={isLoadingSlots}
            isSunday={isSunday}
            justTakenIds={justTakenIds}
            onPickNextOpenDay={nextOpenDay ? () => handleDateChange(nextOpenDay.date) : undefined}
            error={formik.touched.slotId && formik.errors.slotId ? formik.errors.slotId : undefined}
          />

          {!isSunday && (
            <form
              id="booking-form"
              onSubmit={formik.handleSubmit}
              noValidate
              className="space-y-5 rounded-card border border-border bg-surface p-5 sm:p-6"
              aria-labelledby="who-heading"
            >
              <h2 id="who-heading" className="font-heading text-xl font-extrabold text-text">
                Who's visiting
              </h2>
              <FormikSelect
                name="visitTypeCode"
                label="Reason for visit"
                required
                options={visitTypeOptions}
                placeholder={isLoadingVisitTypes ? "Loading visit types…" : "Choose a reason"}
                value={formik.values.visitTypeCode}
                onChange={(val) => formik.setFieldValue("visitTypeCode", val ?? "")}
                error={formik.touched.visitTypeCode ? formik.errors.visitTypeCode : undefined}
              />
              <FormikInput
                name="patientName"
                label="Patient name"
                required
                hint="Use a made-up name. This is a demonstration."
                value={formik.values.patientName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.patientName ? formik.errors.patientName : undefined}
              />
              <FormikInput
                name="contact"
                label="Contact"
                required
                hint="Fictional placeholder. Don't enter a real phone or email."
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact ? formik.errors.contact : undefined}
              />

              {generalError && (
                <div role="alert" className="cf-slide flex items-start gap-3 rounded-2xl border border-danger-line bg-danger-soft px-4 py-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-ink" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-bold text-danger-strong">
                      {isNetworkError
                        ? "We couldn't confirm your booking. Check with your reference or try again."
                        : getErrorMessage(generalError)}
                    </p>
                    {isNetworkError && (
                      <p className="text-sm text-danger-ink">
                        Your connection dropped. Trying again is safe: it won't create a second booking.
                      </p>
                    )}
                    {generalError.kind === "problem" && generalError.problem.requestId && (
                      <p className="font-mono text-xs text-muted">Reference for support: {generalError.problem.requestId}</p>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {!isSunday && (
          <aside
            aria-labelledby="summary-heading"
            className="min-w-0 flex-[1_1_300px] space-y-5 rounded-[1.75rem] bg-primary p-6 text-on-primary lg:sticky lg:top-24"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="summary-heading" className="font-mono text-xs font-normal tracking-[0.12em] text-[color:var(--onink-muted)]">
                YOUR SLOT
              </h2>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-on-accent">{dayLabel}</span>
            </div>
            <p className="text-6xl text-accent sm:text-7xl">
              <RollingDigits
                value={chosenTime}
                label={chosenSlot ? `Selected time ${chosenTime}` : "No time selected yet"}
              />
            </p>
            <dl className="grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
              <div>
                <dt className="text-xs text-[color:var(--onink-muted)]">Length</dt>
                <dd className="font-semibold">{chosenType ? `${chosenType.durationMinutes} ${chosenType.durationMinutes === 1 ? "minute" : "minutes"}` : "20 minutes"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--onink-muted)]">Reason</dt>
                <dd className="font-semibold break-words">{chosenType?.label ?? "Not chosen"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-[color:var(--onink-muted)]">Patient</dt>
                <dd className="font-semibold break-words">{formik.values.patientName.trim() || "Not entered"}</dd>
              </div>
            </dl>
            <button
              type="submit"
              form="booking-form"
              aria-busy={isSubmitting}
              disabled={isSubmitting}
              className="cf-press relative flex h-14 w-full items-center justify-between gap-3 overflow-hidden rounded-full bg-accent pl-6 pr-2 font-heading text-lg font-extrabold tracking-tight text-on-accent disabled:cursor-wait"
            >
              {isSubmitting && <span aria-hidden="true" className="cf-sweep" />}
              <span className="relative">
                {isSubmitting ? "Confirming…" : generalError ? "Try again" : chosenSlot ? `Confirm ${chosenTime}` : "Confirm booking"}
              </span>
              <span aria-hidden="true" className="relative inline-flex size-10 items-center justify-center rounded-full bg-primary">
                {isSubmitting ? (
                  <svg width="26" height="15" viewBox="0 0 28 16">
                    <path className="cf-ecg" d="M0 9h8l2-6 4 11 3-7 2 2h9" stroke="var(--accent)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <ArrowRight className="size-5 text-accent" />
                )}
              </span>
            </button>
            <p className="text-xs text-[color:var(--onink-muted)]">Your reference is issued when you confirm. No payment is needed.</p>
          </aside>
        )}
      </div>
    </div>
  )
}

export default BookPage
