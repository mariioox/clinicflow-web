import { describe, it, expect } from "vitest"
import {
  CLINIC_TZ,
  clinicToday,
  formatClinicTime,
  formatClinicDate,
  getBookingHorizonDates,
} from "./clinicTime"

describe("clinicTime", () => {
  it("uses Africa/Lagos timezone", () => {
    expect(CLINIC_TZ).toBe("Africa/Lagos")
  })

  it("formats clinicToday correctly as YYYY-MM-DD", () => {
    // 2026-10-24 23:30:00 UTC is 2026-10-25 00:30:00 in Africa/Lagos (UTC+1)
    const lateUtc = new Date("2026-10-24T23:30:00Z")
    expect(clinicToday(lateUtc)).toBe("2026-10-25")

    // Early UTC morning is same day in Lagos
    const morningUtc = new Date("2026-10-24T08:00:00Z")
    expect(clinicToday(morningUtc)).toBe("2026-10-24")
  })

  it("formats clinic time in 24-hour HH:mm in Africa/Lagos", () => {
    const timeIso = "2026-10-24T12:00:00Z" // 13:00 in Lagos (UTC+1)
    expect(formatClinicTime(timeIso)).toBe("13:00")
  })

  it("formats clinic date for display with weekday, day, month, year", () => {
    const dateStr = "2026-10-26T09:00:00Z"
    const formatted = formatClinicDate(dateStr)
    expect(formatted).toContain("26")
    expect(formatted).toContain("Oct")
    expect(formatted).toContain("2026")
  })

  it("generates booking horizon of 14 days by default", () => {
    const horizon = getBookingHorizonDates(14)
    expect(horizon).toHaveLength(14)
    expect(horizon[0].label).toContain("Today")
    // Should have isSunday boolean flag on every item
    horizon.forEach((item) => {
      expect(typeof item.isSunday).toBe("boolean")
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
