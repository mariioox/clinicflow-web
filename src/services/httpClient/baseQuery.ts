import { fetchBaseQuery } from "@reduxjs/toolkit/query"
import type { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query"
import { env } from "@/utils/env"
import { toApiError, type ApiError } from "./apiError"
import type { RootState } from "@/store"
import { signedOut } from "@/store/authSlice"

export type ExtraOptions = {
  auth?: "staff"
}

const raw = fetchBaseQuery({ baseUrl: env.apiBaseUrl })

export const baseQuery: BaseQueryFn<
  FetchArgs,
  unknown,
  ApiError,
  ExtraOptions
> = async (args, api, extraOptions) => {
  const headers = new Headers(args.headers as HeadersInit | undefined)
  headers.set("X-Request-Id", crypto.randomUUID()) // every call, for log tracing

  const state = api.getState() as RootState
  const token = state.auth.token

  if (extraOptions?.auth === "staff" && token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const result = await raw({ ...args, headers }, api, {})
  if (!result.error) {
    return { data: result.data, meta: result.meta }
  }

  const responseMeta = result.meta?.response
  // Pass the HTTP status along: a 401/403/5xx without a Problem body (e.g. an empty
  // Spring Security 401, or the host's HTML 502 while waking) is still an HTTP error, not a network drop.
  const httpStatus = typeof result.error.status === "number" ? result.error.status : undefined
  const apiError = toApiError(result.error.data || result.error, responseMeta, httpStatus)

  // Only a staff call's 401 signs staff out. A patient's 401 means a wrong manage token.
  if (extraOptions?.auth === "staff" && apiError.kind === "problem" && apiError.status === 401) {
    api.dispatch(signedOut())
  }

  return { error: apiError }
}
