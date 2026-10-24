import type { Estimate } from "@/models"
import { cn } from "@/lib/utils"

export type EstimateTextProps = {
  estimate?: Estimate | null
  className?: string
}

export function EstimateText({ estimate, className }: EstimateTextProps) {
  if (!estimate) return null

  return (
    <div className={cn("text-xs text-muted space-y-0.5", className)}>
      <p className="font-medium text-text">
        About {estimate.minutes} min <span className="font-normal text-muted">(estimate)</span>
      </p>
      {estimate.basis && (
        <p className="text-[11px] text-muted italic">
          Basis: {estimate.basis}
        </p>
      )}
    </div>
  )
}
