import { baseApi } from "@/services/httpClient/baseApi"
import type { StaffAppointment, AdmitWalkInArgs } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const walkInsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    admitWalkIn: builder.mutation<StaffAppointment, AdmitWalkInArgs>({
      query: ({ idempotencyKey, body }) => ({
        url: "/api/v1/walk-ins",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      extraOptions: { auth: "staff" },
      invalidatesTags: (_r, _e, { date }) => [
        { type: ApiTags.Appointment, id: "LIST" },
        { type: ApiTags.Queue, id: date },
        { type: ApiTags.Dashboard, id: date },
        ApiTags.Activity,
      ],
    }),
  }),
})

export const { useAdmitWalkInMutation } = walkInsApi
