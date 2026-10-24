import type { components } from "@/api/schema"

export type Problem = components["schemas"]["Problem"]

export type ProblemError<C extends string = string> = {
  kind: "problem"
  status: number
  problem: Problem & { code?: C }
  retryAfterSeconds?: number
}

export type NetworkError = {
  kind: "network"
  status: "FETCH_ERROR" | "TIMEOUT_ERROR" | "PARSING_ERROR"
  message?: string
}

export type ApiError = ProblemError | NetworkError

export function isProblem<C extends NonNullable<Problem["code"]>>(
  e: unknown,
  code?: C,
): e is ProblemError<C> {
  if (!e || typeof e !== "object") return false
  const err = e as ApiError
  if (err.kind !== "problem") return false
  if (code && err.problem.code !== code) return false
  return true
}

export function toApiError(errorData: unknown, response?: Response, httpStatus?: number): ApiError {
  let retryAfterSeconds: number | undefined = undefined
  if (response) {
    const retryHeader = response.headers.get("Retry-After")
    if (retryHeader) {
      const parsed = parseInt(retryHeader, 10)
      if (!isNaN(parsed)) retryAfterSeconds = parsed
    }
  }

  if (errorData && typeof errorData === "object" && "status" in errorData && "code" in errorData) {
    return {
      kind: "problem",
      status: (errorData as { status: number }).status || 500,
      problem: errorData as Problem,
      retryAfterSeconds,
    }
  }

  // An HTTP error whose body isn't a Problem: keep the real status and synthesise a Problem,
  // so callers (e.g. the staff 401 sign-out) still branch correctly.
  if (httpStatus !== undefined) {
    const code: Problem["code"] =
      httpStatus === 401 ? "UNAUTHENTICATED"
      : httpStatus === 403 ? "FORBIDDEN"
      : httpStatus === 404 ? "NOT_FOUND"
      : httpStatus === 429 ? "RATE_LIMITED"
      : "INTERNAL_ERROR"
    return {
      kind: "problem",
      status: httpStatus,
      problem: { title: "Request failed", status: httpStatus, code, requestId: response?.headers.get("X-Request-Id") ?? "" },
      retryAfterSeconds,
    }
  }

  return {
    kind: "network",
    status: "FETCH_ERROR",
    message: errorData instanceof Error ? errorData.message : "Network error or server unavailable",
  }
}
