import type { Dashboard } from "@/models"
import { Card } from "@/components/ui/card"
import { Calendar, CheckCircle2, Clock, Stethoscope, Ban, Users, Footprints } from "lucide-react"

export type MetricsCardsProps = {
  dashboard: Dashboard
}

export function MetricsCards({ dashboard }: MetricsCardsProps) {
  const cards = [
    {
      label: "Total Today",
      value: dashboard.appointmentsTotal,
      icon: Calendar,
      accent: "text-blue-700 bg-blue-50/80 border-blue-200",
    },
    {
      label: "Booked (Upcoming)",
      value: dashboard.booked,
      icon: Clock,
      accent: "text-primary bg-soft border-border",
    },
    {
      label: "Waiting in Queue",
      value: dashboard.waiting,
      icon: Users,
      accent: "text-amber-700 bg-amber-50/80 border-amber-200",
    },
    {
      label: "In Consultation",
      value: dashboard.inConsultation,
      icon: Stethoscope,
      accent: "text-purple-700 bg-purple-50/80 border-purple-200",
    },
    {
      label: "Completed",
      value: dashboard.completed,
      icon: CheckCircle2,
      accent: "text-emerald-700 bg-emerald-50/80 border-emerald-200",
    },
    {
      label: "Cancelled",
      value: dashboard.cancelled,
      icon: Ban,
      accent: "text-slate-700 bg-slate-50/80 border-slate-200",
    },
    {
      label: "Walk-in Admissions",
      value: dashboard.walkIns,
      icon: Footprints,
      accent: "text-indigo-700 bg-indigo-50/80 border-indigo-200",
    },
  ]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card
              key={c.label}
              className={`p-4 flex flex-col justify-between transition-all border ${c.accent}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text)]">{c.label}</span>
                <Icon className="size-4 shrink-0" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] mt-3">
                {c.value}
              </div>
            </Card>
          )
        })}
      </div>
      <p className="text-[11px] text-[var(--color-text-muted)] italic text-right">
        Computed from today's records on request (no pre-stored aggregations).
      </p>
    </div>
  )
}
