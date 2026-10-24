import { cn } from "@/lib/utils"

/** "clinicflow" wordmark with its emerald/lime dot. Decorative dot; the word is the accessible name. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 font-heading text-2xl font-extrabold lowercase tracking-[-0.045em] text-text",
        className,
      )}
    >
      clinicflow
      <span
        aria-hidden="true"
        className="inline-block size-2.5 rounded-full bg-primary shadow-[inset_0_0_0_3px_var(--accent)]"
      />
    </span>
  )
}
