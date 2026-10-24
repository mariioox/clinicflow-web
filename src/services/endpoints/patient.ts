import { baseApi } from "@/services/httpClient/baseApi"
import type {
  BookingCreated,
  PatientAppointment,
  CreateAppointmentArgs,
  CancelPatientAppointmentArgs,
  ReschedulePatientAppointmentArgs,
} from "@/models"
import { ApiTags } from "@/utils/apiTags"

export const patientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPatientAppointment: builder.query<PatientAppointment, string>({
      query: (reference) => ({
        url: `/api/v1/patient/appointments/${encodeURIComponent(reference)}`,
      }),
      providesTags: (_r, _e, reference) => [{ type: ApiTags.PatientAppointment, id: reference }],
    }),

    createAppointment: builder.mutation<BookingCreated, CreateAppointmentArgs>({
      query: ({ idempotencyKey, body }) => ({
        url: "/api/v1/patient/appointments",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: (_r, _e, { date }) => [{ type: ApiTags.Slots, id: date }],
    }),

    cancelPatientAppointment: builder.mutation<PatientAppointment, CancelPatientAppointmentArgs>({
      query: ({ reference, manageToken, body }) => ({
        url: `/api/v1/patient/appointments/${encodeURIComponent(reference)}/cancellation`,
        method: "POST",
        body: body ?? {},
        headers: { "X-Manage-Token": manageToken },
      }),
      invalidatesTags: (_r, _e, { reference }) => [
        { type: ApiTags.PatientAppointment, id: reference },
        ApiTags.Slots,
      ],
    }),

    reschedulePatientAppointment: builder.mutation<PatientAppointment, ReschedulePatientAppointmentArgs>({
      query: ({ reference, manageToken, body }) => ({
        url: `/api/v1/patient/appointments/${encodeURIComponent(reference)}/slot`,
        method: "PUT",
        body,
        headers: { "X-Manage-Token": manageToken },
      }),
      invalidatesTags: (_r, _e, { reference }) => [
        { type: ApiTags.PatientAppointment, id: reference },
        ApiTags.Slots,
      ],
    }),
  }),
})

export const {
  useGetPatientAppointmentQuery,
  useCreateAppointmentMutation,
  useCancelPatientAppointmentMutation,
  useReschedulePatientAppointmentMutation,
} = patientApi
