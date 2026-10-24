import { forwardRef, type HTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type PillVariant = "default" | "primary" | "accent" | "muted" | "outline" | "danger" | "success"

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: PillVariant
  icon?: ReactNode
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { className, variant = "default", icon, children, ...props },
  ref,
) {
  const variantStyles: Record<PillVariant, string> = {
    default: "bg-surface border border-border text-muted",
    primary: "bg-primary/20 border border-primary/30 text-primary font-semibold",
    accent: "bg-primary text-on-primary font-semibold shadow-xs",
    muted: "bg-surface-hover/80 border border-border-subtle text-muted",
    outline: "border border-border text-text hover:bg-surface-hover",
    danger: "bg-danger/15 border border-danger/30 text-danger font-medium",
    success: "bg-success/15 border border-success/30 text-success font-medium",
  }

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors select-none",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  )
})
