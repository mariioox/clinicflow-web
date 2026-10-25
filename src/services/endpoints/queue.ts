import { baseApi } from "@/services/httpClient/baseApi"
import type { QueueView } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const queueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQueue: builder.query<QueueView, string>({
      query: (date) => ({
        url: "/api/v1/queue",
        params: { date },
      }),
      extraOptions: { auth: "staff" },
      providesTags: (_r, _e, date) => [{ type: ApiTags.Queue, id: date }],
    }),
  }),
})

export const { useGetQueueQuery } = queueApi
