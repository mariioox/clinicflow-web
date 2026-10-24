import * as Yup from "yup"

export const bookingSchema = Yup.object().shape({
  patientName: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be 120 characters or fewer")
    .required("Patient name is required"),
  contact: Yup.string()
    .trim()
    .min(3, "Contact must be at least 3 characters")
    .max(60, "Contact must be 60 characters or fewer")
    .required("Contact info is required"),
  visitTypeCode: Yup.string()
    .required("Please select a visit type"),
  slotId: Yup.string()
    .required("Please select a time slot"),
})

export type BookingFormValues = Yup.InferType<typeof bookingSchema>

export const manageCancelSchema = Yup.object().shape({
  manageToken: Yup.string()
    .trim()
    .required("Manage token is required to cancel"),
  reason: Yup.string()
    .trim()
    .max(200, "Reason must be 200 characters or fewer"),
})

export type ManageCancelFormValues = Yup.InferType<typeof manageCancelSchema>

export const manageRescheduleSchema = Yup.object().shape({
  manageToken: Yup.string()
    .trim()
    .required("Manage token is required to reschedule"),
  slotId: Yup.string()
    .required("Please select a new time slot"),
})

export type ManageRescheduleFormValues = Yup.InferType<typeof manageRescheduleSchema>
