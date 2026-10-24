import type { Problem } from "@/models"
import type { ApiError } from "@/services/httpClient/apiError"

export const PROBLEM_MESSAGES: Record<NonNullable<Problem["code"]>, string> = {
  VALIDATION_FAILED: "Please check the information you entered.",
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "We couldn't find that booking. Check the reference and try again.",
  SLOT_TAKEN: "That slot has just been taken. Please choose another time.",
  SLOT_IN_PAST: "That time has already passed. Please choose a future slot.",
  INVALID_TRANSITION: "That change isn't allowed from the current status.",
  STALE_STATE: "This appointment was already updated by someone else.",
  CLINIC_CLOSED: "The clinic is closed on this date.",
  IDEMPOTENCY_KEY_MISMATCH: "A submission error occurred. Please try submitting again.",
  IDEMPOTENCY_IN_PROGRESS: "Still confirming your request… Please wait a moment.",
  RATE_LIMITED: "Too many requests. Please wait before trying again.",
  INTERNAL_ERROR: "Something went wrong on our end. Safe to try again.",
}

export function getProblemMessage(problem?: Problem | null): string {
  if (!problem) return "An unexpected error occurred. Please try again."
  if (problem.detail) return problem.detail
  if (problem.code && PROBLEM_MESSAGES[problem.code]) {
    return PROBLEM_MESSAGES[problem.code]
  }
  return problem.title || "An unexpected error occurred."
}

export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "An unexpected error occurred. Please try again."
  if ("kind" in error) {
    const apiErr = error as ApiError
    if (apiErr.kind === "problem") {
      return getProblemMessage(apiErr.problem)
    }
    return apiErr.message || "Network error. Please check your connection and try again."
  }
  if ("code" in error || "title" in error) {
    return getProblemMessage(error as Problem)
  }
  return "An unexpected error occurred. Please try again."
}
