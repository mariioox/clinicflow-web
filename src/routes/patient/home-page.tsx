import { Link, useNavigate } from "react-router-dom"
import { Calendar, Search, ShieldCheck } from "lucide-react"
import { routes } from "@/utils/routes"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-10 py-6 sm:py-10">
      <header className="space-y-3 text-center max-w-xl mx-auto">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
          Welcome to ClinicFlow
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
          Organised, dignified outpatient appointments and live queue tracking for Demo Community Clinic.
        </p>
      </header>

      {/* Two Big Choices */}
      <section aria-label="Patient options" className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
        {/* Choice 1: Book a Visit */}
        <Card className="p-6 sm:p-8 flex flex-col justify-between cf-lift hover:border-primary transition-all duration-200">
          <div className="space-y-4">
            <div className="size-14 rounded-2xl bg-soft text-primary border border-border flex items-center justify-center shadow-2xs" aria-hidden="true">
              <Calendar className="size-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-[var(--color-text)]">Book a visit</h2>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Choose an available appointment slot, pick your consultation reason, and receive your booking reference instantly.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate(routes.book)}
              className="w-full text-base font-semibold rounded-full min-h-[48px] shadow-xs active:scale-[0.98] transition-all"
            >
              Book a visit
            </Button>
          </div>
        </Card>

        {/* Choice 2: Check My Booking */}
        <Card className="p-6 sm:p-8 flex flex-col justify-between cf-lift hover:border-primary transition-all duration-200">
          <div className="space-y-4">
            <div className="size-14 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shadow-2xs" aria-hidden="true">
              <Search className="size-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-[var(--color-text)]">Check my booking</h2>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                Track your live position in today&apos;s queue or manage/reschedule your visit securely using your reference.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate(routes.track)}
              className="w-full text-base font-semibold rounded-full min-h-[48px] shadow-xs active:scale-[0.98] transition-all"
            >
              Check my booking
            </Button>
          </div>
        </Card>
      </section>

      {/* Staff Portal Link */}
      <section aria-label="Staff access" className="max-w-2xl mx-auto">
        <Card className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-[var(--color-surface)]/80">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Clinic Staff</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Reception and clinical staff sign-in</p>
            </div>
          </div>
          <Link
            to={routes.staff.login}
            className="inline-flex items-center justify-center min-h-[40px] px-4 text-xs font-semibold rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors"
          >
            Staff Login
          </Link>
        </Card>
      </section>
    </div>
  )
}

export default HomePage
