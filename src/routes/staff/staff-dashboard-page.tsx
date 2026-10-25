import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { PageHeader } from "@/components/shared/page-header"
import { MetricsCards } from "@/modules/dashboard/metrics-cards"
import { RecentActivity } from "@/modules/dashboard/recent-activity"
import { ResetDemoModal } from "@/modules/dashboard/reset-demo-modal"
import { useGetDashboardQuery } from "@/services/endpoints/dashboard"
import { useListRecentActivityQuery } from "@/services/endpoints/activity"
import { useAppSelector } from "@/store/hooks"
import { clinicToday } from "@/utils/clinicTime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorState } from "@/components/ui/error-state"
import { getErrorMessage } from "@/utils/problemMessages"
import { RefreshCw, RotateCcw } from "lucide-react"

export function StaffDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get("date") || clinicToday()

  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === "ADMIN"

  const [isResetOpen, setIsResetOpen] = useState(false)

  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError,
    error,
    refetch: refetchDashboard,
    isFetching,
  } = useGetDashboardQuery(date)

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useListRecentActivityQuery(20)

  function handleDateChange(newDate: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("date", newDate)
    setSearchParams(nextParams)
  }

  function handleRefreshAll() {
    refetchDashboard()
    refetchActivities()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Staff Dashboard"
          description="Clinic daily summary metrics and operational activity stream."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="dash-date" className="font-semibold text-text">
              Date:
            </label>
            <Input
              id="dash-date"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-9 w-auto text-xs"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* ADMIN only reset button */}
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsResetOpen(true)}
              className="text-xs"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Reset Demo Day
            </Button>
          )}
        </div>
      </div>

      {isLoadingDashboard ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-control" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load dashboard metrics"
          description={getErrorMessage(error)}
          onRetry={() => handleRefreshAll()}
          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
        />
      ) : dashboard ? (
        <div className="space-y-6">
          <MetricsCards dashboard={dashboard} />
          <RecentActivity activities={activities} isLoading={isLoadingActivities} />
        </div>
      ) : null}

      {isAdmin && (
        <ResetDemoModal
          isOpen={isResetOpen}
          onClose={() => {
            setIsResetOpen(false)
            handleRefreshAll()
          }}
        />
      )}
    </div>
  )
}

export default StaffDashboardPage
