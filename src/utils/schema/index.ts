import type { Problem } from "@/models"

export * from "./bookingSchema"
export * from "./staffSchema"

export function toFormikErrors(problem: Problem): Record<string, string> {
  const errors: Record<string, string> = {}
  if (problem.fieldErrors && Array.isArray(problem.fieldErrors)) {
    for (const fe of problem.fieldErrors) {
      if (fe.field && fe.message) {
        errors[fe.field] = fe.message
      }
    }
  }
  return errors
}
