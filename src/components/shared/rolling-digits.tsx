import { cn } from "@/lib/utils"

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

export type RollingDigitsProps = {
  /** e.g. "09:20" or "3". Digits roll; any other character is shown as-is. */
  value: string
  /** What a screen reader hears, e.g. "Selected time 09:20". Defaults to the value. */
  label?: string
  className?: string
}

/**
 * Odometer-style number: when `value` changes, each digit column rolls to its new
 * position (staggered left to right). Uses a monospaced font so the width never jumps.
 * The visual columns are aria-hidden; the real value is exposed once as text.
 * Motion is removed by the global prefers-reduced-motion rule.
 */
export function RollingDigits({ value, label, className }: RollingDigitsProps) {
  return (
    <span className={cn("inline-flex flex-nowrap items-end whitespace-nowrap font-mono tabular-nums leading-none", className)}>
      <span className="sr-only">{label ?? value}</span>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden="true" className="cf-roll">
            <span
              className="cf-roll-col"
              style={{ transform: `translateY(-${Number(ch)}em)`, transitionDelay: `${i * 50}ms` }}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
