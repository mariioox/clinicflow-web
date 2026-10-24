import { forwardRef } from "react"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"

export type FormikTextareaProps = TextareaProps & {
  name: string
  label: string
  hint?: string
  required?: boolean
  error?: string
}

export const FormikTextarea = forwardRef<HTMLTextAreaElement, FormikTextareaProps>(function FormikTextarea(
  { label, hint, required, error, ...props },
  ref,
) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => <Textarea ref={ref} {...control} {...props} />}
    </FormField>
  )
})
