import { useState, useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { useGetPatientAppointmentQuery, patientApi } from "@/services/endpoints/patient"
import type { PatientAppointment } from "@/models"
import { env } from "@/utils/env"

export function useLiveAppointment(reference: string) {
  const dispatch = useAppDispatch()
  const [streamOpen, setStreamOpen] = useState(false)

  // Poll every 10 s while the stream is down. Stop polling once it's open.
  const query = useGetPatientAppointmentQuery(reference, {
    pollingInterval: streamOpen ? 0 : 10_000,
  })
  const found = query.isSuccess
  const status = query.data?.status

  useEffect(() => {
    if (!found) return // don't open a stream for a reference that 404s
    if (status === "COMPLETED" || status === "CANCELLED") {
      setStreamOpen(false)
      return
    }

    const url = `${env.apiBaseUrl}/api/v1/patient/appointments/${encodeURIComponent(reference)}/events`
    const es = new EventSource(url)
    es.onopen = () => setStreamOpen(true)
    es.onerror = () => setStreamOpen(false) // the browser retries by itself; we poll meanwhile
    es.addEventListener("appointment", (e) => {
      try {
        const next = JSON.parse((e as MessageEvent<string>).data) as PatientAppointment
        dispatch(patientApi.util.upsertQueryData("getPatientAppointment", reference, next))
      } catch {
        // ignore malformed event
      }
    })
    return () => es.close()
  }, [reference, found, dispatch, status])

  return { ...query, reconnecting: found && !streamOpen && status !== "COMPLETED" && status !== "CANCELLED" }
}
