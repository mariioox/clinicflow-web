import { baseApi } from "@/services/httpClient/baseApi"
import { ApiTags } from "@/utils/apiTags"

export const demoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    resetDemoDay: builder.mutation<void, void>({
      query: () => ({
        url: "/api/v1/demo/reset",
        method: "POST",
      }),
      extraOptions: { auth: "staff" },
      invalidatesTags: [
        ApiTags.Slots,
        ApiTags.Appointment,
        ApiTags.Queue,
        ApiTags.Dashboard,
        ApiTags.Activity,
      ],
    }),
  }),
})

export const { useResetDemoDayMutation } = demoApi
