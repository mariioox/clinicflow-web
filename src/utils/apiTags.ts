export const ApiTags = {
  Slots: "Slots",
  Appointment: "Appointment",
  Queue: "Queue",
  Dashboard: "Dashboard",
  Activity: "Activity",
  PatientAppointment: "PatientAppointment",
} as const

export type ApiTagType = (typeof ApiTags)[keyof typeof ApiTags]
