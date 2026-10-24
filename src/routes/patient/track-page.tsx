import { useParams, Link } from "react-router-dom"
import { PageHeader } from "@/components/shared/page-header"
import { ReferenceForm } from "@/modules/tracking/reference-form"
import { PositionCard } from "@/modules/tracking/position-card"
import { Card } from "@/components/ui/card"
import { ErrorState } from "@/components/ui/error-state"
import { useLiveAppointment } from "@/hooks/use-live-appointment"
import { isProblem, type ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { routes } from "@/utils/routes"
import { ArrowLeft } from "lucide-react"

export function TrackPage() {
  const { reference } = useParams<{ reference?: string }>()

  if (!reference) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader
          title="Track Your Booking"
          description="Check your live position in the queue and estimated wait time."
        />
        <Card className="p-6 sm:p-8 shadow-xs">
          <ReferenceForm />
        </Card>
      </div>
    )
  }

  return <TrackDetails reference={reference} />
}

function TrackDetails({ reference }: { reference: string }) {
  const { data: appointment, isLoading, isError, error, reconnecting } =
    useLiveAppointment(reference)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title={`Tracking ${reference}`}
          description="Connecting to clinic live queue updates…"
        />
        <div className="rounded-control border border-border bg-surface p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-28 bg-slate-100 rounded" />
          <div className="h-20 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  if (isError) {
    const apiError = error as ApiError
    const isNotFound = isProblem(apiError, "NOT_FOUND")

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader
          title="Booking Not Found"
          description="Unable to locate this appointment in the system."
        />

        <Card className="p-6 sm:p-8 shadow-xs space-y-6">
          <ErrorState
            title={isNotFound ? "We couldn't find that booking reference" : "Unable to load appointment"}
            description={
              isNotFound
                ? "Please check the reference code from your booking confirmation and try again."
                : getErrorMessage(apiError)
            }
          />

          <div className="pt-2">
            <ReferenceForm initialValue={reference} />
          </div>

          <div className="pt-2 text-center">
            <Link
              to={routes.home}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium"
            >
              <ArrowLeft className="size-3.5" />
              Return to Home
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!appointment) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={routes.track}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-text font-medium"
        >
          <ArrowLeft className="size-3.5" />
          Look up another booking
        </Link>
      </div>

      <PageHeader
        title={`Queue Status — ${appointment.patientName}`}
        description="Live queue tracking updated automatically as consultations proceed."
      />

      <PositionCard
        appointment={appointment}
        reconnecting={reconnecting}
      />
    </div>
  )
}

export default TrackPage
