import { Check } from "lucide-react"
import type { Slot } from "@/models"
import { formatClinicTime } from "@/utils/clinicTime"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { HeartbeatLoader } from "@/components/shared/heartbeat-loader"
import { ClosedClinic } from "./closed-clinic"

export type SlotPickerProps = {
  slots: Slot[]
  selectedSlotId: string | null
  onSelectSlot: (slotId: string) => void
  isLoading?: boolean
  isSunday?: boolean
  error?: string
  /** Slots that were taken by someone else during this visit (live update or SLOT_TAKEN). */
  justTakenIds?: readonly string[]
  /** Sunday empty state's "See Monday's times" action. */
  onPickNextOpenDay?: () => void
}

type HourRow =
  | { kind: "slots"; hour: string; slots: Slot[] }
  | { kind: "gap"; hour: string; until: string }

/** Groups slots by clinic hour ("09", "10"…) and inserts a row for any gap (e.g. lunch). */
function toHourRows(slots: Slot[]): HourRow[] {
  const byHour = new Map<string, Slot[]>()
  for (const slot of slots) {
    const hour = formatClinicTime(slot.startsAt).slice(0, 2)
    byHour.set(hour, [...(byHour.get(hour) ?? []), slot])
  }
  const hours = [...byHour.keys()].sort()
  const rows: HourRow[] = []
  hours.forEach((hour, i) => {
    const prev = hours[i - 1]
    if (prev !== undefined && Number(hour) - Number(prev) > 1) {
      const gapStart = String(Number(prev) + 1).padStart(2, "0")
      rows.push({ kind: "gap", hour: gapStart, until: hour })
    }
    rows.push({ kind: "slots", hour, slots: byHour.get(hour) ?? [] })
  })
  return rows
}

export function SlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  isLoading = false,
  isSunday = false,
  error,
  justTakenIds = [],
  onPickNextOpenDay,
}: SlotPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-5 rounded-card border border-border bg-surface p-5 sm:p-6" aria-busy="true">
        <HeartbeatLoader title="Getting the schedule" />
        <div className="space-y-3" aria-hidden="true">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-3.5">
              <span className="cf-skel h-8 w-12 shrink-0 rounded-lg" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                {[1, 2, 3].map((c) => (
                  <span key={c} className="cf-skel h-16 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isSunday) {
    return <ClosedClinic onPickNextOpenDay={onPickNextOpenDay} />
  }

  if (!slots || slots.length === 0) {
    return (
      <EmptyState
        title="No times on this day"
        description="There are no appointments available for this date. Pick another day above."
        className="rounded-card border border-dashed border-border-input bg-surface p-8"
      />
    )
  }

  const availableCount = slots.filter((s) => s.available).length
  const rows = toHourRows(slots)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="slot-picker-label" className="font-heading text-xl font-extrabold text-text">
          Choose a time <span className="text-danger" aria-hidden="true">*</span>
        </h2>
        <span className="text-sm text-muted">
          <span className="font-mono font-medium text-text">{availableCount}</span> of {slots.length} free · 20 min each
        </span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="slot-picker-label"
        aria-describedby={error ? "slot-picker-error" : undefined}
        className="rounded-card border border-border bg-surface px-4 py-1.5 sm:px-6"
      >
        {rows.map((row) =>
          row.kind === "gap" ? (
            <div key={`gap-${row.hour}`} className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-b-0">
              <span aria-hidden="true" className="w-12 shrink-0 font-heading text-3xl font-extrabold tracking-tight text-border-input sm:w-16">
                {row.hour}
              </span>
              <p className="flex-1 rounded-2xl border border-dashed border-border-input px-4 py-3 text-sm text-muted">
                Break · no appointments {row.hour}:00–{row.until}:00
              </p>
            </div>
          ) : (
            <div key={row.hour} className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-b-0">
              <span aria-hidden="true" className="w-12 shrink-0 font-heading text-3xl font-extrabold tracking-tight text-text sm:w-16">
                {row.hour}
              </span>
              <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2">
                {row.slots.map((slot) => {
                  const time = formatClinicTime(slot.startsAt)
                  const isSelected = selectedSlotId === slot.id && slot.available
                  const justTaken = justTakenIds.includes(slot.id)

                  if (!slot.available) {
                    return (
                      <div
                        key={slot.id}
                        role="radio"
                        aria-checked={false}
                        aria-disabled={true}
                        aria-label={`${time}, ${justTaken ? "just taken" : "taken"}`}
                        className="relative flex min-h-16 cursor-not-allowed select-none flex-col justify-center rounded-2xl border-2 border-soft bg-soft px-3 py-2 text-muted"
                      >
                        <span className="font-mono text-base">{time}</span>
                        <span className="text-xs font-semibold">{justTaken ? "Just taken" : "Taken"}</span>
                        <span aria-hidden="true" className={cn("cf-strike", justTaken ? "bg-primary" : "bg-border-input")} />
                      </div>
                    )
                  }

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${time}, ${isSelected ? "selected" : "free"}`}
                      onClick={() => onSelectSlot(slot.id)}
                      className={cn(
                        "cf-press cf-lift flex min-h-16 flex-col justify-center rounded-2xl border-2 px-3 py-2 text-left",
                        isSelected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-input bg-surface text-text hover:border-primary",
                      )}
                    >
                      <span className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-base sm:text-lg">{time}</span>
                        {isSelected && <Check aria-hidden="true" className="size-4 text-accent" strokeWidth={3} />}
                      </span>
                      <span className="text-xs font-semibold">{isSelected ? "Selected" : "Free"}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ),
        )}
      </div>

      {error && (
        <p id="slot-picker-error" className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
