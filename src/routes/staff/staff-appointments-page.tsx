import { useSearchParams } from "react-router-dom"
import { AppointmentFilters } from "@/modules/appointments/appointment-filters"
import { AppointmentTable } from "@/modules/appointments/appointment-table"
import { useListAppointmentsQuery } from "@/services/endpoints/appointments"
import { clinicToday, formatClinicDate } from "@/utils/clinicTime"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { getErrorMessage } from "@/utils/problemMessages"
import { HeartbeatLoader } from "@/components/shared/heartbeat-loader"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

export function StaffAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const date = searchParams.get("date") || clinicToday()
  const statusParam = searchParams.get("status") || undefined
  const q = searchParams.get("q") || undefined
  const page = parseInt(searchParams.get("page") || "0", 10)
  const size = 20

  const { data, isLoading, isError, error, refetch, isFetching } = useListAppointmentsQuery({
    date,
    status: statusParam,
    q,
    page,
    size,
  })

  const hasFilters = Boolean(
    (searchParams.get("date") && searchParams.get("date") !== clinicToday()) ||
      statusParam ||
      q,
  )

  function handleClearFilters() {
    const nextParams = new URLSearchParams()
    nextParams.set("date", clinicToday())
    nextParams.set("page", "0")
    setSearchParams(nextParams)
  }

  function handlePageChange(newPage: number) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(newPage))
    setSearchParams(nextParams)
  }

  const totalPages = data ? Math.ceil(data.totalItems / size) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">{formatClinicDate(date)}</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-text tracking-[-0.04em]">
            Appointments
          </h1>
          <p className="text-sm text-muted">Scheduled visits and walk-ins. Check in is instant; the server confirms it.</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto text-xs h-9 px-3 font-semibold"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Shared FilterBar Component */}
      <AppointmentFilters
        resultMessage={
          data
            ? `${data.totalItems} ${data.totalItems === 1 ? "appointment" : "appointments"} found`
            : undefined
        }
        onFiltersChange={() => refetch()}
      />

      {/* Five States: Loading, Error, Empty / Success */}
      {isLoading ? (
        <div className="rounded-card border border-border bg-surface p-6 space-y-5" aria-busy="true">
          <HeartbeatLoader title="Loading today's appointments" />
          <div className="space-y-2.5" aria-hidden="true">
            <div className="cf-skel h-12 rounded-xl" />
            <div className="cf-skel h-12 rounded-xl" />
            <div className="cf-skel h-12 rounded-xl" />
          </div>
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load appointments"
          description={getErrorMessage(error)}
          onRetry={() => refetch()}
          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
        />
      ) : (
        <div className="space-y-4">
          <AppointmentTable
            appointments={data?.items || []}
            date={date}
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
            listArgs={{ date, status: statusParam, q, page, size }}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted">
              <span>
                Showing page {page + 1} of {totalPages} ({data?.totalItems} total appointments)
              </span>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => handlePageChange(page - 1)}
                  className="h-8 px-2.5"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                  className="h-8 px-2.5"
                >
                  Next
                  <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StaffAppointmentsPage
