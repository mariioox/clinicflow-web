import { baseApi } from "@/services/httpClient/baseApi"
import type { ActivityEntry } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listRecentActivity: builder.query<ActivityEntry[], number | void>({
      query: (limit = 20) => ({
        url: "/api/v1/activity",
        params: { limit },
      }),
      extraOptions: { auth: "staff" },
      providesTags: [ApiTags.Activity],
    }),
  }),
})

export const { useListRecentActivityQuery } = activityApi
