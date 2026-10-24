import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type MetaFieldProps = {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  className?: string
}

export function MetaField({ label, value, hint, icon, className }: MetaFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-muted text-[11px] font-medium tracking-wide uppercase">
        {icon && <span className="size-3.5 shrink-0 opacity-70">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-text break-words">
        {value}
      </div>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  )
}
