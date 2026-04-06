import { Input } from "@/core/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/core/components/ui/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface NumberFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  field,
  label,
  description,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        value={field.state.value as number}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(Number(e.target.value))}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
