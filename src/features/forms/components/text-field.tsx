import { Input } from "@/core/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/core/components/ui/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface TextFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  type?: "text" | "email" | "password" | "url"
}

export function TextField({
  field,
  label,
  description,
  placeholder,
  type = "text",
}: TextFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        type={type}
        placeholder={placeholder}
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
