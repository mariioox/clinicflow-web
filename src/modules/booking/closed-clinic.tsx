import { Button } from "@/components/ui/button"

export type ClosedClinicProps = {
  onPickNextOpenDay?: () => void
  nextOpenLabel?: string
}

/** Sunday empty state: the clinic is asleep. Decorative art is aria-hidden; the text carries the meaning. */
export function ClosedClinic({ onPickNextOpenDay, nextOpenLabel = "Monday" }: ClosedClinicProps) {
  return (
    <div className="cf-fade flex flex-col items-center gap-2.5 rounded-card border border-border bg-surface px-6 py-10 text-center">
      <div className="cf-bob relative h-28 w-[150px]">
        <svg aria-hidden="true" width="150" height="112" viewBox="0 0 150 112">
          <path d="M20 46 L72 16 L124 46" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <rect x="28" y="42" width="88" height="62" rx="8" fill="var(--soft)" stroke="var(--primary)" strokeWidth="2.5" />
          <path d="M72 50v14M65 57h14" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
          <rect x="38" y="70" width="16" height="12" rx="2" fill="var(--primary)" />
          <rect x="90" y="70" width="16" height="12" rx="2" fill="var(--primary)" />
          <rect x="62" y="76" width="20" height="28" rx="4" fill="var(--primary)" />
          <path d="M128 10a11 11 0 1 0 12 15a9 9 0 0 1 -12 -15z" fill="var(--accent)" stroke="var(--primary)" strokeWidth="2" />
          <path d="M6 104h138" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span aria-hidden="true" className="cf-zz left-[104px] top-[34px] text-sm text-primary">z</span>
        <span aria-hidden="true" className="cf-zz left-[112px] top-[26px] text-lg text-primary [animation-delay:0.8s]">z</span>
        <span aria-hidden="true" className="cf-zz left-[121px] top-[16px] text-xl text-primary [animation-delay:1.6s]">Z</span>
      </div>
      <h2 className="font-heading text-2xl font-extrabold text-text sm:text-3xl">The clinic is closed on Sundays</h2>
      <p className="max-w-md text-muted">Reception is resting. Appointments run Monday to Saturday, 08:00–16:00.</p>
      {onPickNextOpenDay && (
        <Button variant="primary" size="lg" onClick={onPickNextOpenDay} className="mt-2 cf-press">
          See {nextOpenLabel}'s times →
        </Button>
      )}
    </div>
  )
}
