import { Textarea } from "@/core/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/core/components/ui/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface TextareaFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  rows?: number
}

export function TextareaField({
  field,
  label,
  description,
  placeholder,
  rows = 3,
}: TextareaFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        placeholder={placeholder}
        rows={rows}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
