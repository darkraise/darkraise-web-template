import type { AnyFieldApi } from "@tanstack/react-form"
import type { InputHTMLAttributes, ReactNode } from "react"
import { Field, FieldLabel, FieldError } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"

interface AuthFormFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "onBlur"
> {
  field: AnyFieldApi
  label: string
  labelSlot?: ReactNode
}

export function AuthFormField({
  field,
  label,
  labelSlot,
  ...inputProps
}: AuthFormFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      {labelSlot ?? <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
