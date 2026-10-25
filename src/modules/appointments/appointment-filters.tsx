import { useSearchParams } from "react-router-dom"
import { FilterBar, FilterGroup } from "@/components/ui/filter-bar"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { clinicToday } from "@/utils/clinicTime"
import type { Status } from "@/models"

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "BOOKED", label: "Booked" },
  { value: "WAITING", label: "Waiting" },
  { value: "IN_CONSULTATION", label: "In consultation" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export type AppointmentFiltersProps = {
  resultMessage?: string
  onFiltersChange?: () => void
}

export function AppointmentFilters({ resultMessage, onFiltersChange }: AppointmentFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentDate = searchParams.get("date") || clinicToday()
  const statusParam = searchParams.get("status")
  const selectedStatuses = statusParam ? statusParam.split(",") : []
  const currentQ = searchParams.get("q") || ""

  function applyFilters(updates: { date?: string; status?: string[]; q?: string }) {
    const nextParams = new URLSearchParams(searchParams)

    if (updates.date !== undefined) {
      if (updates.date) nextParams.set("date", updates.date)
      else nextParams.delete("date")
    }

    if (updates.status !== undefined) {
      if (updates.status.length > 0) nextParams.set("status", updates.status.join(","))
      else nextParams.delete("status")
    }

    if (updates.q !== undefined) {
      if (updates.q.trim()) nextParams.set("q", updates.q.trim())
      else nextParams.delete("q")
    }

    nextParams.set("page", "0") // reset to first page on filter change
    setSearchParams(nextParams)
    onFiltersChange?.()
  }

  function handleStatusToggle(statusValue: string) {
    const nextStatuses = selectedStatuses.includes(statusValue)
      ? selectedStatuses.filter((s) => s !== statusValue)
      : [...selectedStatuses, statusValue]
    applyFilters({ status: nextStatuses })
  }

  function handleClearFilters() {
    const nextParams = new URLSearchParams()
    nextParams.set("date", clinicToday())
    nextParams.set("page", "0")
    setSearchParams(nextParams)
    onFiltersChange?.()
  }

  // Count active filters in the children slots (date difference + selected statuses)
  const isDateCustom = currentDate !== clinicToday()
  const activeCount = (isDateCustom ? 1 : 0) + selectedStatuses.length

  return (
    <FilterBar
      query={currentQ}
      onQueryChange={(q) => applyFilters({ q })}
      searchLabel="Search appointments"
      searchPlaceholder="Search patient name or reference…"
      activeCount={activeCount}
      onClearAll={handleClearFilters}
      resultMessage={resultMessage}
      className="rounded-card border border-border-subtle bg-surface p-5 shadow-xs"
    >
      <FormField label="Filter by date" className="sm:w-44">
        {(field) => (
          <Input
            {...field}
            type="date"
            value={currentDate}
            onChange={(e) => applyFilters({ date: e.target.value })}
            className="h-10 text-xs"
          />
        )}
      </FormField>

      <FilterGroup legend="Status">
        {STATUS_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            checked={selectedStatuses.includes(opt.value)}
            onCheckedChange={() => handleStatusToggle(opt.value)}
          />
        ))}
      </FilterGroup>
    </FilterBar>
  )
}
