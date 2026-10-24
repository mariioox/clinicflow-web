import { forwardRef } from "react"
import { Select, type SelectProps, type SelectOption } from "@/components/ui/select"
import { FormField } from "@/components/ui/form-field"

export type FormikSelectProps = Omit<SelectProps, "value" | "onValueChange"> & {
  name: string
  label: string
  hint?: string
  required?: boolean
  value: string | undefined
  onChange: (value: string | undefined) => void
  options: SelectOption[]
  error?: string
}

export const FormikSelect = forwardRef<HTMLButtonElement, FormikSelectProps>(function FormikSelect(
  { label, hint, required, error, value, onChange, options, ...props },
  ref,
) {
  return (
    <FormField label={label} hint={hint} error={error} required={required}>
      {(control) => (
        <Select
          ref={ref}
          {...control}
          value={value}
          onValueChange={onChange}
          options={options}
          {...props}
        />
      )}
    </FormField>
  )
})
