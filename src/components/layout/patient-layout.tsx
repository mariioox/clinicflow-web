import { Outlet, NavLink, Link, useLocation } from "react-router-dom"
import { routes } from "@/utils/routes"
import { useGetMetaQuery } from "@/services/endpoints/meta"
import { clinicToday, formatClinicDate } from "@/utils/clinicTime"
import { DemoBanner } from "@/components/shared/demo-banner"
import { OfflineBar } from "./offline-bar"
import { Calendar } from "lucide-react"
import { Wordmark } from "@/components/shared/wordmark"

export function PatientLayout() {
  const { data: meta } = useGetMetaQuery()
  const location = useLocation()
  const clinicName = meta?.clinicName || "Demo Community Clinic (fictional)"
  const todayLabel = formatClinicDate(clinicToday())

  const isBookActive = location.pathname.startsWith("/book")
  const isTrackActive = location.pathname.startsWith("/track") || location.pathname.startsWith("/manage")
  const isStaffActive = location.pathname.startsWith("/staff")

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <OfflineBar />
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-primary focus:border focus:border-border"
      >
        Skip to main content
      </a>

      {/* Demo Banner */}
      <DemoBanner />

      {/* Patient Header — Warm accessible health bar */}
      <header className="border-b border-border px-4 sm:px-6 py-3.5 sticky top-0 z-30 bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to={routes.home} className="flex items-center gap-2.5 group">
            <div className="flex items-center gap-2.5">
              <Wordmark />
              <span className="text-muted/40 text-xs hidden sm:inline">|</span>
              <span className="text-xs text-muted hidden sm:inline font-medium">{clinicName}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Date Badge Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-border text-xs text-muted font-medium shadow-2xs">
              <Calendar className="size-3.5 text-primary" />
              <span>{todayLabel}</span>
            </div>

            {/* Segmented Pill Navigation */}
            <nav className="flex items-center p-1 rounded-full bg-soft border border-border text-xs shadow-2xs" aria-label="Patient navigation">
              <NavLink
                to={routes.book}
                aria-current={isBookActive ? "page" : undefined}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full transition-all text-xs font-semibold ${
                  isBookActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-muted hover:text-text hover:bg-surface/70"
                }`}
              >
                Book Visit
              </NavLink>
              <NavLink
                to={routes.track}
                aria-current={isTrackActive ? "page" : undefined}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full transition-all text-xs font-semibold ${
                  isTrackActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-muted hover:text-text hover:bg-surface/70"
                }`}
              >
                Track
              </NavLink>
              <NavLink
                to={routes.staff.login}
                aria-current={isStaffActive ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full transition-all text-xs font-semibold hidden sm:inline-flex ${
                  isStaffActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-muted hover:text-text hover:bg-surface/70"
                }`}
              >
                Staff Portal
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface py-6 px-4 text-center text-xs text-muted space-y-1">
        <p>ClinicFlow &bull; TeSA Capstone &bull; Demonstration Clinic System</p>
        <p className="text-[11px] text-muted">All appointments, names, and operational metrics are simulated.</p>
      </footer>
    </div>
  )
}
