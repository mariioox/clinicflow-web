import { baseApi } from "@/services/httpClient/baseApi"
import type {
  StaffAppointment,
  AppointmentPage,
  ActivityEntry,
  ListAppointmentsArgs,
  SetAppointmentStatusArgs,
  RescheduleAppointmentArgs,
} from "@/models"
import { ApiTags } from "@/utils/apiTags"
import { isProblem, type ApiError } from "@/services/httpClient/apiError"

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAppointments: builder.query<AppointmentPage, ListAppointmentsArgs>({
      query: (args) => {
        const params: Record<string, string | number> = { date: args.date }
        if (args.status) {
          params.status = Array.isArray(args.status) ? args.status.join(",") : args.status
        }
        if (args.q) params.q = args.q
        if (args.page !== undefined) params.page = args.page
        if (args.size !== undefined) params.size = args.size

        return {
          url: "/api/v1/appointments",
          params,
        }
      },
      extraOptions: { auth: "staff" },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: ApiTags.Appointment, id })),
              { type: ApiTags.Appointment, id: "LIST" },
            ]
          : [{ type: ApiTags.Appointment, id: "LIST" }],
    }),

    getAppointment: builder.query<StaffAppointment, string>({
      query: (id) => ({
        url: `/api/v1/appointments/${id}`,
      }),
      extraOptions: { auth: "staff" },
      providesTags: (_r, _e, id) => [{ type: ApiTags.Appointment, id }],
    }),

    setAppointmentStatus: builder.mutation<StaffAppointment, SetAppointmentStatusArgs>({
      query: ({ id, body }) => ({
        url: `/api/v1/appointments/${id}/status`,
        method: "PUT",
        body,
      }),
      extraOptions: { auth: "staff" },
      async onQueryStarted({ id, body, listArgs }, { dispatch, queryFulfilled }) {
        const optimistic = body.status === "WAITING" && body.expectedStatus === "BOOKED"
        const patch = (optimistic && listArgs)
          ? dispatch(
              appointmentsApi.util.updateQueryData("listAppointments", listArgs, (draft) => {
                const row = draft.items.find((a) => a.id === id)
                if (row) row.status = "WAITING"
              }),
            )
          : undefined

        try {
          await queryFulfilled
        } catch (err) {
          const error = (err as { error: ApiError })?.error
          if (isProblem(error) && error.problem.current && listArgs) {
            const current = error.problem.current as StaffAppointment
            dispatch(
              appointmentsApi.util.updateQueryData("listAppointments", listArgs, (draft) => {
                const i = draft.items.findIndex((a) => a.id === id)
                if (i >= 0) draft.items[i] = current
              }),
            )
          } else {
            patch?.undo()
          }
        }
      },
      invalidatesTags: (_r, _e, { id, date }) => [
        { type: ApiTags.Appointment, id },
        { type: ApiTags.Appointment, id: "LIST" },
        { type: ApiTags.Queue, id: date },
        { type: ApiTags.Dashboard, id: date },
        ApiTags.Activity,
      ],
    }),

    rescheduleAppointment: builder.mutation<StaffAppointment, RescheduleAppointmentArgs>({
      query: ({ id, body }) => ({
        url: `/api/v1/appointments/${id}/slot`,
        method: "PUT",
        body,
      }),
      extraOptions: { auth: "staff" },
      invalidatesTags: (_r, _e, { id, date }) => [
        { type: ApiTags.Appointment, id },
        { type: ApiTags.Appointment, id: "LIST" },
        { type: ApiTags.Slots, id: date },
        { type: ApiTags.Queue, id: date },
        ApiTags.Activity,
      ],
    }),

    listAppointmentActivity: builder.query<ActivityEntry[], string>({
      query: (id) => ({
        url: `/api/v1/appointments/${id}/activity`,
      }),
      extraOptions: { auth: "staff" },
      providesTags: (_r, _e, id) => [{ type: ApiTags.Activity, id }],
    }),
  }),
})

export const {
  useListAppointmentsQuery,
  useGetAppointmentQuery,
  useSetAppointmentStatusMutation,
  useRescheduleAppointmentMutation,
  useListAppointmentActivityQuery,
} = appointmentsApi
