import { useGetMetaQuery } from "@/services/endpoints/meta"

export function DemoBanner() {
  const { data: meta } = useGetMetaQuery()
  const clinicName = meta?.clinicName || "Demo Community Clinic (fictional)"

  // The contract says demoMode is always true; render while meta loads too, so the label is never missing.
  if (meta && meta.demoMode === false) return null

  return (
    <aside
      aria-label="Demonstration notice"
      className="flex items-center justify-center gap-2.5 bg-primary px-4 py-2 text-center text-xs text-on-primary"
    >
      <span className="rounded-full bg-accent px-2 py-px font-mono text-[11px] font-medium tracking-wider text-on-accent">DEMO</span>
      <span>Demonstration data. Fictional clinic and patients. ({clinicName})</span>
    </aside>
  )
}
