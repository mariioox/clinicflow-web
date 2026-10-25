import { describe, it, expect } from "vitest"
import {
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  canReschedule,
  canCancel,
} from "./status"
import type { Status } from "@/models"

describe("status transitions and permissions", () => {
  it("provides user-friendly labels for all status codes", () => {
    const statuses: Status[] = ["BOOKED", "WAITING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"]
    statuses.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined()
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0)
    })
  })

  it("allows transition from BOOKED to WAITING and CANCELLED", () => {
    const transitions = ALLOWED_TRANSITIONS["BOOKED"]
    const targetStatuses = transitions.map((t) => t.targetStatus)
    expect(targetStatuses).toContain("WAITING")
    expect(targetStatuses).toContain("CANCELLED")
  })

  it("allows transition from WAITING to IN_CONSULTATION and CANCELLED", () => {
    const transitions = ALLOWED_TRANSITIONS["WAITING"]
    const targetStatuses = transitions.map((t) => t.targetStatus)
    expect(targetStatuses).toContain("IN_CONSULTATION")
    expect(targetStatuses).toContain("CANCELLED")
  })

  it("allows transition from IN_CONSULTATION to COMPLETED only", () => {
    const transitions = ALLOWED_TRANSITIONS["IN_CONSULTATION"]
    expect(transitions).toHaveLength(1)
    expect(transitions[0].targetStatus).toBe("COMPLETED")
  })

  it("terminal statuses have no transitions", () => {
    expect(ALLOWED_TRANSITIONS["COMPLETED"]).toHaveLength(0)
    expect(ALLOWED_TRANSITIONS["CANCELLED"]).toHaveLength(0)
  })

  it("canReschedule is only true for BOOKED", () => {
    expect(canReschedule("BOOKED")).toBe(true)
    expect(canReschedule("WAITING")).toBe(false)
    expect(canReschedule("IN_CONSULTATION")).toBe(false)
    expect(canReschedule("COMPLETED")).toBe(false)
    expect(canReschedule("CANCELLED")).toBe(false)
  })

  it("canCancel is true for BOOKED and WAITING only", () => {
    expect(canCancel("BOOKED")).toBe(true)
    expect(canCancel("WAITING")).toBe(true)
    expect(canCancel("IN_CONSULTATION")).toBe(false)
    expect(canCancel("COMPLETED")).toBe(false)
    expect(canCancel("CANCELLED")).toBe(false)
  })
})
