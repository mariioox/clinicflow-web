import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check, Copy } from "lucide-react"
import type { BookingCreated } from "@/models"
import { routes } from "@/utils/routes"
import { formatClinicDate, formatClinicTime } from "@/utils/clinicTime"
import { useDecodeText } from "@/hooks/use-decode-text"

export type BookingConfirmationProps = {
  confirmation: BookingCreated
  onBookAnother: () => void
}

/** Fixed positions so the burst looks the same every time (and never shifts layout). */
const CONFETTI: { x: number; y: number; delay: number; tone: "accent" | "white" | "mint"; dot: boolean }[] = [
  { x: -46, y: -10, delay: 0, tone: "accent", dot: false },
  { x: 96, y: -18, delay: 60, tone: "white", dot: false },
  { x: -30, y: 40, delay: 120, tone: "mint", dot: true },
  { x: 86, y: 46, delay: 40, tone: "accent", dot: false },
  { x: 18, y: -48, delay: 90, tone: "white", dot: false },
  { x: 54, y: -40, delay: 150, tone: "mint", dot: true },
  { x: -58, y: 22, delay: 200, tone: "accent", dot: false },
  { x: 104, y: 14, delay: 240, tone: "white", dot: false },
  { x: 30, y: 72, delay: 180, tone: "accent", dot: true },
  { x: -8, y: -34, delay: 260, tone: "mint", dot: false },
]
const TONE_CLASS = { accent: "text-accent", white: "text-on-primary", mint: "text-[color:var(--soft)]" } as const

export function BookingConfirmation({ confirmation, onBookAnother }: BookingConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [copied, setCopied] = useState<"ref" | "token" | null>(null)
  const { appointment, manageToken } = confirmation
  const decodedRef = useDecodeText(appointment.reference)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  async function handleCopy(text: string, which: "ref" | "token") {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard can be blocked (permissions, insecure context). The text is selectable anyway.
    }
  }

  const when = appointment.slot
    ? `${formatClinicDate(appointment.slot.startsAt)} at ${formatClinicTime(appointment.slot.startsAt)}`
    : null

  return (
    <section
      aria-labelledby="confirmation-heading"
      className="cf-rise flex flex-wrap items-center gap-8 rounded-[2rem] bg-primary p-7 text-on-primary sm:gap-12 sm:p-11"
    >
      <div className="min-w-0 flex-[999_1_380px]">
        <span className="relative mb-6 inline-flex size-16 items-center justify-center rounded-full bg-accent text-accent">
          <span aria-hidden="true" className="cf-burst" />
          <span aria-hidden="true" className="cf-burst cf-burst-late" />
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`cf-conf ${TONE_CLASS[c.tone]}`}
              style={{ left: c.x, top: c.y, animationDelay: `${200 + c.delay}ms` }}
            >
              {c.dot ? (
                <span className="block size-[7px] rounded-full bg-current" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              )}
            </span>
          ))}
          <Check aria-hidden="true" className="relative size-7 text-primary" strokeWidth={3.2} />
        </span>
        <h1
          id="confirmation-heading"
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-4xl font-extrabold leading-none tracking-tight focus:outline-none sm:text-6xl"
        >
          Appointment confirmed
        </h1>
        <p className="mt-3 text-lg text-[color:var(--onink-muted)]">
          {when ? (
            <>
              See you <strong className="text-on-primary">{when}</strong>.{" "}
            </>
          ) : null}
          Keep your reference: it's how you check your place in the queue.
        </p>
        <p className="mt-2 text-sm text-[color:var(--onink-muted)]">
          {appointment.patientName} · {appointment.visitType.label}
        </p>
      </div>

      <div className="min-w-0 flex-[1_1_320px] space-y-4 rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] text-[color:var(--onink-muted)]">YOUR REFERENCE</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="font-mono text-3xl tracking-wide text-accent whitespace-nowrap">
              <span aria-hidden="true">{decodedRef}</span>
              <span className="sr-only">{appointment.reference}</span>
            </p>
            <button
              type="button"
              onClick={() => handleCopy(appointment.reference, "ref")}
              aria-label="Copy booking reference"
              className="cf-press inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/40 hover:bg-white/10"
            >
              {copied === "ref" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] text-[color:var(--onink-muted)]">MANAGE TOKEN · SHOWN ONCE</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <code className="min-w-0 select-all break-all font-mono text-base">{manageToken}</code>
            <button
              type="button"
              onClick={() => handleCopy(manageToken, "token")}
              aria-label="Copy manage token"
              className="cf-press inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/40 hover:bg-white/10"
            >
              {copied === "token" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-[color:var(--onink-muted)]">You'll need it to cancel or change this booking. We can't show it again.</p>
        </div>
        <p role="status" className="sr-only">
          {copied === "ref" ? "Reference copied" : copied === "token" ? "Manage token copied" : ""}
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Link
            to={routes.trackRef(appointment.reference)}
            className="cf-press inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 font-bold text-on-accent"
          >
            Track my place <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onBookAnother}
            className="cf-press inline-flex min-h-12 items-center rounded-full border border-white/50 px-5 font-semibold hover:bg-white/10"
          >
            Book another visit
          </button>
        </div>
      </div>
    </section>
  )
}
