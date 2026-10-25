import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { PageHeader } from "@/components/shared/page-header"
import { QueueBoard } from "@/modules/queue/queue-board"
import { WalkInModal } from "@/modules/queue/walk-in-modal"
import { useGetQueueQuery } from "@/services/endpoints/queue"
import { clinicToday } from "@/utils/clinicTime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorState } from "@/components/ui/error-state"
import { getErrorMessage } from "@/utils/problemMessages"
import { UserPlus, RefreshCw } from "lucide-react"

export function StaffQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = searchParams.get("date") || clinicToday()

  const [isWalkInOpen, setIsWalkInOpen] = useState(false)

  // Polls every 10 seconds per AGENT.md specification
  const { data: queue, isLoading, isError, error, refetch, isFetching } = useGetQueueQuery(date, {
    pollingInterval: 10_000,
  })

  function handleDateChange(newDate: string) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("date", newDate)
    setSearchParams(nextParams)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Live Queue Board"
          description="Real-time consultation and waiting queue for reception."
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="queue-date" className="font-semibold text-text">
              Date:
            </label>
            <Input
              id="queue-date"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-9 w-auto text-xs"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`size-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWalkInOpen(true)}
            className="text-xs"
          >
            <UserPlus className="size-3.5 mr-1.5" />
            Admit Walk-in
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-control border border-border bg-surface p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-28 bg-slate-100 rounded" />
          <div className="h-36 bg-slate-100 rounded" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load queue"
          description={getErrorMessage(error)}
          onRetry={() => refetch()}
          className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
        />
      ) : queue ? (
        <QueueBoard queue={queue} date={date} />
      ) : null}

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        date={date}
      />
    </div>
  )
}

export default StaffQueuePage
