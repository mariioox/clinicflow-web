import { describe, it, expect } from "vitest"
import { loginSchema, walkInSchema, staffCancelSchema } from "./staffSchema"

describe("loginSchema validation", () => {
  it("passes validation with valid email and password", async () => {
    const valid = { email: "receptionist@clinicflow.demo", password: "Password123" }
    await expect(loginSchema.validate(valid)).resolves.toEqual(valid)
  })

  it("fails if email is invalid format", async () => {
    const invalid = { email: "not-an-email", password: "Password123" }
    await expect(loginSchema.validate(invalid)).rejects.toThrow("Please enter a valid email address")
  })

  it("fails if password or email is missing", async () => {
    await expect(loginSchema.validate({ email: "", password: "pwd" })).rejects.toThrow("Email is required")
    await expect(loginSchema.validate({ email: "user@demo.com", password: "" })).rejects.toThrow("Password is required")
  })
})

describe("walkInSchema validation", () => {
  it("enforces length limits matching the contract", async () => {
    const valid = {
      patientName: "John Doe",
      contact: "555-0199",
      visitTypeCode: "GENERAL",
      aheadOfQueue: false,
    }
    await expect(walkInSchema.validate(valid)).resolves.toBeDefined()

    const shortName = { ...valid, patientName: "J" }
    await expect(walkInSchema.validate(shortName)).rejects.toThrow("Name must be at least 2 characters")
  })
})

describe("staffCancelSchema validation", () => {
  it("allows optional cancellation reason under 200 chars", async () => {
    await expect(staffCancelSchema.validate({ reason: "" })).resolves.toBeDefined()
    await expect(staffCancelSchema.validate({ reason: "Patient no-show" })).resolves.toBeDefined()
    await expect(staffCancelSchema.validate({ reason: "x".repeat(201) })).rejects.toThrow(
      "Reason must be 200 characters or fewer",
    )
  })
})
