export const CLINIC_TZ = "Africa/Lagos"

/** The clinic's calendar date as YYYY-MM-DD. Use for every `date` query param. */
export function clinicToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

/** "09:20" in clinic time, whatever the viewer's timezone. */
export function formatClinicTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** "Mon 26 Oct 2026" formatted for headings/dates. */
export function formatClinicDate(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

/** Get the next N calendar dates (YYYY-MM-DD) in Africa/Lagos starting from today */
export function getBookingHorizonDates(days = 14): Array<{ date: string; label: string; isSunday: boolean }> {
  const result: Array<{ date: string; label: string; isSunday: boolean }> = []
  const todayStr = clinicToday()
  const base = new Date(`${todayStr}T12:00:00Z`)

  for (let i = 0; i < days; i++) {
    const d = new Date(base.getTime() + i * 86400000)
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: CLINIC_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)

    const weekday = new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC_TZ,
      weekday: "short",
    }).format(d)

    const dayMonth = new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC_TZ,
      day: "numeric",
      month: "short",
    }).format(d)

    result.push({
      date,
      label: i === 0 ? `Today (${dayMonth})` : `${weekday}, ${dayMonth}`,
      isSunday: weekday.toLowerCase().startsWith("sun"),
    })
  }

  return result
}
