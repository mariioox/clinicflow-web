// src/models/index.ts — aliases only, zero runtime
import type { components } from "@/api/schema"

type S = components["schemas"]

export type Status = S["Status"]
export type Meta = S["Meta"]
export type VisitType = S["VisitType"]
export type Slot = S["Slot"]
export type SlotWindow = S["SlotWindow"]
export type BookingRequest = S["BookingRequest"]
export type Estimate = S["Estimate"]
export type PatientAppointment = S["PatientAppointment"]
export type BookingCreated = S["BookingCreated"]
export type StaffAppointment = S["StaffAppointment"]
export type AppointmentPage = S["AppointmentPage"]
export type StatusChangeRequest = S["StatusChangeRequest"]
export type WalkInRequest = S["WalkInRequest"]
export type QueueView = S["QueueView"]
export type Dashboard = S["Dashboard"]
export type ActivityEntry = S["ActivityEntry"]
export type LoginRequest = S["LoginRequest"]
export type StaffUser = S["StaffUser"]
export type LoginResponse = S["LoginResponse"]
export type FieldError = S["FieldError"]
export type Problem = S["Problem"]

// Args types for RTK Query endpoints
export type CreateAppointmentArgs = {
  idempotencyKey: string
  date: string
  body: BookingRequest
}

export type CancelPatientAppointmentArgs = {
  reference: string
  manageToken: string
  body?: { reason?: string }
}

export type ReschedulePatientAppointmentArgs = {
  reference: string
  manageToken: string
  body: { slotId: string }
}

export type ListAppointmentsArgs = {
  date: string
  status?: string | Status[]
  q?: string
  page?: number
  size?: number
}

export type SetAppointmentStatusArgs = {
  id: string
  date: string
  body: StatusChangeRequest
  listArgs?: ListAppointmentsArgs
}

export type RescheduleAppointmentArgs = {
  id: string
  date: string
  body: { slotId: string }
}

export type AdmitWalkInArgs = {
  idempotencyKey: string
  date: string
  body: WalkInRequest
}
