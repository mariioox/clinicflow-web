import * as Yup from "yup"

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .required("Password is required"),
})

export type LoginFormValues = Yup.InferType<typeof loginSchema>

export const walkInSchema = Yup.object().shape({
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
  aheadOfQueue: Yup.boolean().default(false),
})

export type WalkInFormValues = Yup.InferType<typeof walkInSchema>

export const staffCancelSchema = Yup.object().shape({
  reason: Yup.string()
    .trim()
    .max(200, "Reason must be 200 characters or fewer"),
})

export type StaffCancelFormValues = Yup.InferType<typeof staffCancelSchema>
