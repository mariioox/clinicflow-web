import { baseApi } from "@/services/httpClient/baseApi"
import type { LoginRequest, LoginResponse, StaffUser } from "@/models"

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        body,
      }),
    }),
    getMe: builder.query<StaffUser, void>({
      query: () => ({
        url: "/api/v1/auth/me",
      }),
      extraOptions: { auth: "staff" },
    }),
  }),
})

export const { useLoginMutation, useGetMeQuery, useLazyGetMeQuery } = authApi
