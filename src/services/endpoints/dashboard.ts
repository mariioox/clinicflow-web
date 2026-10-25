import { baseApi } from "@/services/httpClient/baseApi"
import type { Dashboard } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<Dashboard, string>({
      query: (date) => ({
        url: "/api/v1/dashboard",
        params: { date },
      }),
      extraOptions: { auth: "staff" },
      providesTags: (_r, _e, date) => [{ type: ApiTags.Dashboard, id: date }],
    }),
  }),
})

export const { useGetDashboardQuery } = dashboardApi
