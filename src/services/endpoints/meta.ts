import { baseApi } from "@/services/httpClient/baseApi"
import type { Meta, VisitType } from "@/models"

export const metaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMeta: builder.query<Meta, void>({
      query: () => ({ url: "/api/v1/meta" }),
    }),
    listVisitTypes: builder.query<VisitType[], void>({
      query: () => ({ url: "/api/v1/visit-types" }),
    }),
  }),
})

export const { useGetMetaQuery, useListVisitTypesQuery } = metaApi
