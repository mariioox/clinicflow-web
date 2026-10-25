import { describe, it, expect } from "vitest"
import { bookingSchema, manageCancelSchema, manageRescheduleSchema } from "./bookingSchema"

describe("bookingSchema validation", () => {
  it("passes validation for valid booking inputs", async () => {
    const valid = {
      patientName: "Ada Lovelace",
      contact: "ada@example.com",
      visitTypeCode: "GENERAL_CONSULTATION",
      slotId: "slot-123",
    }
    await expect(bookingSchema.validate(valid)).resolves.toEqual(valid)
  })

  it("fails if patientName is shorter than 2 characters", async () => {
    const invalid = {
      patientName: "A",
      contact: "ada@example.com",
      visitTypeCode: "GENERAL_CONSULTATION",
      slotId: "slot-123",
    }
    await expect(bookingSchema.validate(invalid)).rejects.toThrow("Name must be at least 2 characters")
  })

  it("fails if contact is missing or shorter than 3 characters", async () => {
    const invalid = {
      patientName: "Ada Lovelace",
      contact: "12",
      visitTypeCode: "GENERAL_CONSULTATION",
      slotId: "slot-123",
    }
    await expect(bookingSchema.validate(invalid)).rejects.toThrow("Contact must be at least 3 characters")
  })

  it("fails if visitTypeCode or slotId is empty", async () => {
    const missingSlot = {
      patientName: "Ada Lovelace",
      contact: "08012345678",
      visitTypeCode: "GENERAL_CONSULTATION",
      slotId: "",
    }
    await expect(bookingSchema.validate(missingSlot)).rejects.toThrow("Please select a time slot")
  })
})

describe("manageCancelSchema validation", () => {
  it("requires manageToken", async () => {
    const invalid = { manageToken: "", reason: "Cannot make it" }
    await expect(manageCancelSchema.validate(invalid)).rejects.toThrow("Manage token is required to cancel")
  })

  it("enforces 200 char maximum on cancellation reason", async () => {
    const invalid = {
      manageToken: "token-abc-123",
      reason: "a".repeat(201),
    }
    await expect(manageCancelSchema.validate(invalid)).rejects.toThrow("Reason must be 200 characters or fewer")
  })
})

describe("manageRescheduleSchema validation", () => {
  it("requires manageToken and slotId", async () => {
    const valid = { manageToken: "tok-1", slotId: "slot-456" }
    await expect(manageRescheduleSchema.validate(valid)).resolves.toEqual(valid)

    const invalid = { manageToken: "tok-1", slotId: "" }
    await expect(manageRescheduleSchema.validate(invalid)).rejects.toThrow("Please select a new time slot")
  })
})
