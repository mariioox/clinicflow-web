import type { ActivityEntry } from "@/models"
import { formatClinicTime } from "@/utils/clinicTime"
import { routes } from "@/utils/routes"
import { Link } from "react-router-dom"
import { Activity } from "lucide-react"

export type RecentActivityProps = {
  activities: ActivityEntry[]
  isLoading?: boolean
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="rounded-control border border-border bg-surface p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-text">Recent Clinic Activity</h3>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-control border border-border bg-surface p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-primary" />
        <h3 className="text-sm font-bold text-text">Recent Clinic Activity</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-muted">No activity records logged today.</p>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((entry) => (
            <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">
                    {entry.eventType.replace(/_/g, " ")}
                  </span>
                  <Link
                    to={routes.staff.appointment(entry.appointmentId)}
                    className="font-mono text-[11px] text-primary hover:underline"
                  >
                    {entry.reference}
                  </Link>
                </div>
                <p className="text-muted text-[11px]">
                  Actor: <span className="font-medium text-text">{entry.actor}</span> ({entry.actorRole})
                  {entry.toStatus && ` → Status: ${entry.toStatus}`}
                </p>
              </div>

              <span className="text-[11px] text-muted whitespace-nowrap">
                {formatClinicTime(entry.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
