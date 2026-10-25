import { useState } from "react"
import { useFormik } from "formik"
import { walkInSchema, toFormikErrors } from "@/utils/schema"
import { FormikInput } from "@/components/shared/formik-input"
import { FormikSelect } from "@/components/shared/formik-select"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { useListVisitTypesQuery } from "@/services/endpoints/meta"
import { useAdmitWalkInMutation } from "@/services/endpoints/walkIns"
import { useIdempotencyKey } from "@/hooks/use-idempotency-key"
import type { ApiError } from "@/services/httpClient/apiError"
import { getErrorMessage } from "@/utils/problemMessages"
import { announce } from "@/components/shared/live-region"
import { AlertCircle } from "lucide-react"

export type WalkInModalProps = {
  isOpen: boolean
  onClose: () => void
  date: string
}

export function WalkInModal({ isOpen, onClose, date }: WalkInModalProps) {
  const { key: idempotencyKey, renew: renewIdempotencyKey } = useIdempotencyKey()
  const { data: visitTypes = [], isLoading: isLoadingVisitTypes } = useListVisitTypesQuery()
  const [admitWalkIn, { isLoading: isAdmitting }] = useAdmitWalkInMutation()
  const [generalError, setGeneralError] = useState<ApiError | null>(null)

  const formik = useFormik({
    initialValues: {
      patientName: "",
      contact: "",
      visitTypeCode: "",
      aheadOfQueue: false,
    },
    validationSchema: walkInSchema,
    onSubmit: async (values) => {
      setGeneralError(null)
      try {
        const res = await admitWalkIn({
          idempotencyKey,
          date,
          body: {
            patientName: values.patientName,
            contact: values.contact,
            visitTypeCode: values.visitTypeCode,
            aheadOfQueue: Boolean(values.aheadOfQueue),
          },
        }).unwrap()

        announce(`Walk-in patient ${res.patientName} admitted to queue.`)
        renewIdempotencyKey()
        formik.resetForm()
        onClose()
      } catch (err) {
        const error = err as ApiError
        if (error.kind === "problem" && error.problem.code === "VALIDATION_FAILED") {
          formik.setErrors(toFormikErrors(error.problem))
        } else {
          setGeneralError(error)
        }
      }
    },
  })

  const visitTypeOptions = visitTypes.map((vt) => ({
    value: vt.code,
    label: `${vt.label} (${vt.durationMinutes} min)`,
  }))

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          formik.resetForm()
          setGeneralError(null)
          onClose()
        }
      }}
      title="Admit Walk-in Patient"
      description="Walk-in patients are admitted directly into today's queue as WAITING without a pre-scheduled time slot."
    >
      <form onSubmit={formik.handleSubmit} noValidate className="space-y-4 pt-2">
        <FormikInput
          name="patientName"
          label="Patient Full Name"
          required
          placeholder="e.g. John Doe"
          hint="Fictional name only."
          value={formik.values.patientName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.patientName ? formik.errors.patientName : undefined}
        />

        <FormikInput
          name="contact"
          label="Contact Info"
          required
          placeholder="e.g. 555-0123"
          hint="Fictional placeholder."
          value={formik.values.contact}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.contact ? formik.errors.contact : undefined}
        />

        <FormikSelect
          name="visitTypeCode"
          label="Visit Reason"
          required
          options={visitTypeOptions}
          placeholder={isLoadingVisitTypes ? "Loading visit types…" : "Select visit type"}
          value={formik.values.visitTypeCode}
          onChange={(val) => formik.setFieldValue("visitTypeCode", val ?? "")}
          error={formik.touched.visitTypeCode ? formik.errors.visitTypeCode : undefined}
        />

        <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]">
          <input
            id="aheadOfQueue"
            name="aheadOfQueue"
            type="checkbox"
            checked={formik.values.aheadOfQueue}
            onChange={formik.handleChange}
            className="mt-1 size-4 rounded border-[var(--color-border)] text-primary focus:ring-primary"
          />
          <label htmlFor="aheadOfQueue" className="text-xs text-[var(--color-text)] cursor-pointer select-none">
            <span className="font-semibold block">Prioritize at front of queue</span>
            Place ahead of all waiting patients, but behind anyone currently in consultation.
          </label>
        </div>

        {generalError && (
          <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius)] text-xs text-danger flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{getErrorMessage(generalError)}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isAdmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isAdmitting}
            disabled={isAdmitting}
          >
            Admit to Queue
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
