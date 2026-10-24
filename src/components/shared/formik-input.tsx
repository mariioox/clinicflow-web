import { forwardRef } from "react"
import { Input, type InputProps } from "@/components/ui/input"
import { FormField } from "@/components/ui/form-field"

export type FormikInputProps = InputProps & {
  name: string
  label: string
  hint?: string
  required?: boolean
  error?: string
}

export const FormikInput = forwardRef<HTMLInputElement, FormikInputProps>(function FormikInput(
  { label, hint, required, error, ...props },
  ref,
) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => <Input ref={ref} {...control} {...props} />}
    </FormField>
  )
})
