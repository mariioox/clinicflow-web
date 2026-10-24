import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { routes } from "@/utils/routes"

import { PatientLayout } from "@/components/layout/patient-layout"
import { StaffLayout } from "@/components/layout/staff-layout"
import { StaffGate } from "@/components/layout/staff-gate"

// Patient Pages
import HomePage from "@/routes/patient/home-page"
import BookPage from "@/routes/patient/book-page"
import TrackPage from "@/routes/patient/track-page"
import ManagePage from "@/routes/patient/manage-page"

// Staff Pages
import StaffLoginPage from "@/routes/staff/staff-login-page"

// Staff routes are code-split / lazy-loaded
const StaffAppointmentsPage = lazy(() => import("@/routes/staff/staff-appointments-page"))
const StaffAppointmentDetailPage = lazy(() => import("@/routes/staff/staff-appointment-detail-page"))
const StaffQueuePage = lazy(() => import("@/routes/staff/staff-queue-page"))
const StaffDashboardPage = lazy(() => import("@/routes/staff/staff-dashboard-page"))

function StaffSuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-muted">
      Loading staff view…
    </div>
  )
}

export const router = createBrowserRouter([
  // Patient Shell
  {
    path: routes.home,
    element: <PatientLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "book",
        element: <BookPage />,
      },
      {
        path: "track",
        element: <TrackPage />,
      },
      {
        path: "track/:reference",
        element: <TrackPage />,
      },
      {
        path: "manage/:reference",
        element: <ManagePage />,
      },
    ],
  },

  // Staff Login (standalone)
  {
    path: routes.staff.login,
    element: <StaffLoginPage />,
  },

  // Staff Shell (Protected by StaffGate)
  {
    path: "/staff",
    element: (
      <StaffGate>
        <StaffLayout />
      </StaffGate>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={routes.staff.queue} replace />,
      },
      {
        path: "queue",
        element: (
          <Suspense fallback={<StaffSuspenseFallback />}>
            <StaffQueuePage />
          </Suspense>
        ),
      },
      {
        path: "appointments",
        element: (
          <Suspense fallback={<StaffSuspenseFallback />}>
            <StaffAppointmentsPage />
          </Suspense>
        ),
      },
      {
        path: "appointments/:id",
        element: (
          <Suspense fallback={<StaffSuspenseFallback />}>
            <StaffAppointmentDetailPage />
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<StaffSuspenseFallback />}>
            <StaffDashboardPage />
          </Suspense>
        ),
      },
    ],
  },

  // Fallback
  {
    path: "*",
    element: <Navigate to={routes.home} replace />,
  },
])
