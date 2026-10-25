import { describe, it, expect } from "vitest"
import { isProblem, toApiError, type ProblemError, type NetworkError } from "./apiError"

describe("apiError utilities", () => {
  it("discriminates ProblemError correctly with isProblem", () => {
    const problemErr: ProblemError = {
      kind: "problem",
      status: 409,
      problem: {
        type: "https://example.com/probs/slot-taken",
        title: "Slot Taken",
        status: 409,
        code: "SLOT_TAKEN",
        requestId: "req-test-123",
      },
    }

    const networkErr: NetworkError = {
      kind: "network",
      status: "FETCH_ERROR",
      message: "Network request failed",
    }

    expect(isProblem(problemErr)).toBe(true)
    expect(isProblem(problemErr, "SLOT_TAKEN")).toBe(true)
    expect(isProblem(problemErr, "VALIDATION_FAILED")).toBe(false)
    expect(isProblem(networkErr)).toBe(false)
    expect(isProblem(null)).toBe(false)
    expect(isProblem(undefined)).toBe(false)
    expect(isProblem("some string error")).toBe(false)
  })

  it("converts server problem response to ProblemError", () => {
    const rawProblem = {
      title: "Validation Error",
      status: 422,
      code: "VALIDATION_FAILED",
      detail: "Invalid fields provided",
    }

    const apiError = toApiError(rawProblem)
    expect(apiError.kind).toBe("problem")
    if (apiError.kind === "problem") {
      expect(apiError.status).toBe(422)
      expect(apiError.problem.code).toBe("VALIDATION_FAILED")
    }
  })

  it("converts generic error to NetworkError", () => {
    const err = new Error("Failed to fetch")
    const apiError = toApiError(err)
    expect(apiError.kind).toBe("network")
    if (apiError.kind === "network") {
      expect(apiError.status).toBe("FETCH_ERROR")
      expect(apiError.message).toBe("Failed to fetch")
    }
  })
})

describe("toApiError with a non-Problem HTTP error", () => {
  it("keeps a 401 with an empty body as UNAUTHENTICATED, not a network error", () => {
    const e = toApiError({ status: 401, data: "" }, undefined, 401)
    expect(e.kind).toBe("problem")
    if (e.kind === "problem") {
      expect(e.status).toBe(401)
      expect(e.problem.code).toBe("UNAUTHENTICATED")
    }
  })
  it("still treats a real fetch failure as a network error", () => {
    expect(toApiError({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }).kind).toBe("network")
  })
})

