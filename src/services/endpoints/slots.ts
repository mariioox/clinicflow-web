import { baseApi } from "@/services/httpClient/baseApi"
import type { Slot } from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const slotsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSlots: builder.query<Slot[], string>({
      query: (date) => ({
        url: "/api/v1/slots",
        params: { date },
      }),
      providesTags: (_r, _e, date) => [{ type: ApiTags.Slots, id: date }],
    }),
  }),
})

export const { useListSlotsQuery } = slotsApi
