import { type ReactNode, useEffect, useState } from "react"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"

export type StateViewProps = {
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  isEmpty?: boolean
  emptyMessage?: string
  emptyAction?: ReactNode
  children: ReactNode
}

export function StateView({
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = "No items found.",
  emptyAction,
  children,
}: StateViewProps) {
  const [showSlowMessage, setShowSlowMessage] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowSlowMessage(false)
      return
    }

    const timer = setTimeout(() => {
      setShowSlowMessage(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="space-y-3 py-6" aria-busy="true" aria-label="Loading content">
        <div className="h-6 w-1/3 animate-pulse rounded bg-border/40" />
        <div className="h-20 w-full animate-pulse rounded bg-border/30" />
        <div className="h-20 w-full animate-pulse rounded bg-border/20" />
        {showSlowMessage && (
          <p className="text-xs text-muted text-center pt-2 animate-fade-in">
            Waking up the demo server… (free-tier servers sleep when idle)
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load data"
        description={error}
        onRetry={onRetry}
        className="my-6"
      />
    )
  }

  if (isEmpty) {
    return (
      <div className="my-8">
        <EmptyState
          title="No records found"
          description={emptyMessage}
          className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-8 bg-[var(--color-surface)]"
        />
        {emptyAction ? <div className="mt-3 flex justify-center">{emptyAction}</div> : null}
      </div>
    )
  }

  return <>{children}</>
}
