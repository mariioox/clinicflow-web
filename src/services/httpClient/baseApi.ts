import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery"
import { ApiTags } from "@/utils/apiTags"

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: Object.values(ApiTags),
  endpoints: () => ({}),
})
