import type { Slot } from "@/models"
import { formatClinicTime } from "@/utils/clinicTime"
import { cn } from "@/lib/utils"

export type SlotTakenPanelProps = {
  suggestedSlots: Slot[]
  onSelectSuggested: (slotId: string) => void
  /** The slot the patient lost, so we can name it and say how far each alternative is. */
  lostSlot?: Slot
  selectedSlotId?: string | null
}

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60000)
}

/**
 * SLOT_TAKEN: another patient confirmed the same time a moment earlier.
 * Compact, apologetic, and never a dead end: the nearest free times are one tap away.
 */
export function SlotTakenPanel({ suggestedSlots, onSelectSuggested, lostSlot, selectedSlotId }: SlotTakenPanelProps) {
  const lostTime = lostSlot ? formatClinicTime(lostSlot.startsAt) : "That time"

  return (
    <div role="alert" className="cf-slide flex items-start gap-3 rounded-2xl border border-danger-line bg-danger-soft px-4 py-3">
      <span aria-hidden="true" className="cf-pop mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-danger-dot text-on-danger">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 3.5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="7" cy="10.3" r="1.1" fill="currentColor" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-danger-strong">
          Sorry, {lostTime} was booked by someone else just before you confirmed.
        </p>
        <p className="mb-2.5 mt-0.5 text-sm text-danger-ink">
          {suggestedSlots.length > 0
            ? "Your appointment wasn't made. These nearby times are still free:"
            : "Your appointment wasn't made. Please choose another time below."}
        </p>
        {suggestedSlots.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestedSlots.map((slot, i) => {
              const delta = lostSlot ? minutesBetween(slot.startsAt, lostSlot.startsAt) : 0
              const deltaLabel = delta === 0 ? "" : `${Math.abs(delta)} min ${delta < 0 ? "earlier" : "later"}`
              const isSelected = selectedSlotId === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectSuggested(slot.id)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={cn(
                    "cf-press cf-pop inline-flex min-h-9 items-baseline gap-2 rounded-full border px-3 py-1.5",
                    isSelected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border-input bg-surface text-text hover:border-primary",
                  )}
                >
                  <span className="font-mono text-[15px]">{formatClinicTime(slot.startsAt)}</span>
                  {deltaLabel && <span className="text-xs font-medium opacity-85">{deltaLabel}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
