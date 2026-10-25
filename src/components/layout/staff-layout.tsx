import { Outlet, useNavigate, NavLink, Link, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { signedOut } from "@/store/authSlice"
import { routes } from "@/utils/routes"
import { clinicToday, formatClinicDate } from "@/utils/clinicTime"
import { Button } from "@/components/ui/button"
import { DemoBanner } from "@/components/shared/demo-banner"
import { OfflineBar } from "./offline-bar"
import { Calendar, ChevronDown } from "lucide-react"
import { Wordmark } from "@/components/shared/wordmark"

export function StaffLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((state) => state.auth.user)
  const todayLabel = formatClinicDate(clinicToday())

  const isQueueActive = location.pathname.startsWith("/staff/queue")
  const isAppointmentsActive = location.pathname.startsWith("/staff/appointments")
  const isDashboardActive = location.pathname.startsWith("/staff/dashboard")

  function handleSignOut() {
    dispatch(signedOut())
    navigate(routes.staff.login)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <OfflineBar />
      {/* Skip link */}
      <a
        href="#staff-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-primary focus:border focus:border-border"
      >
        Skip to main content
      </a>

      {/* Demo Banner */}
      <DemoBanner />

      {/* Staff Nav Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to={routes.staff.queue} className="flex items-center gap-2.5 group">
            <div className="flex items-center gap-2.5">
              <Wordmark />
              <span className="text-muted/40 text-xs hidden sm:inline">|</span>
              <span className="text-xs text-muted hidden sm:inline font-medium">{"Demo Community Clinic (fictional)"}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center p-1 rounded-full bg-soft border border-border text-xs shadow-2xs" aria-label="Staff navigation">
            <NavLink
              to={routes.staff.queue}
              aria-current={isQueueActive ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-full transition-all font-semibold ${
                isQueueActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-muted hover:text-text hover:bg-surface/70 font-medium"
              }`}
            >
              Live Queue
            </NavLink>
            <NavLink
              to={routes.staff.appointments}
              aria-current={isAppointmentsActive ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-full transition-all font-semibold ${
                isAppointmentsActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-muted hover:text-text hover:bg-surface/70 font-medium"
              }`}
            >
              Appointments
            </NavLink>
            <NavLink
              to={routes.staff.dashboard}
              aria-current={isDashboardActive ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-full transition-all font-semibold ${
                isDashboardActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-muted hover:text-text hover:bg-surface/70 font-medium"
              }`}
            >
              Dashboard
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
          {/* Date Badge Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-border text-muted font-medium shadow-2xs">
            <Calendar className="size-3.5 text-primary" />
            <span>{todayLabel}</span>
          </div>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border shadow-2xs">
              <div className="size-6 rounded-full bg-soft border border-border text-primary font-bold flex items-center justify-center text-[11px]">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="font-medium text-text block leading-tight">{user.displayName}</span>
                <span className="text-[10px] text-muted block leading-none">{user.role}</span>
              </div>
              <ChevronDown className="size-3 text-muted hidden sm:block" />
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={handleSignOut} className="rounded-full text-xs shadow-2xs">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Staff Main Content */}
      <main id="staff-main" className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
