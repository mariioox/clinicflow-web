export const routes = {
  home: "/",
  book: "/book",
  track: "/track",
  trackRef: (reference: string) => `/track/${encodeURIComponent(reference)}`,
  manageRef: (reference: string) => `/manage/${encodeURIComponent(reference)}`,
  staff: {
    login: "/staff/login",
    appointments: "/staff/appointments",
    appointment: (id: string) => `/staff/appointments/${id}`,
    queue: "/staff/queue",
    dashboard: "/staff/dashboard",
  },
} as const
