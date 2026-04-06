import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group"
import { Label } from "@/core/components/ui/label"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/core/components/ui/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface RadioGroupFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
  options: Array<{ label: string; value: string }>
}

export function RadioGroupField({
  field,
  label,
  description,
  options,
}: RadioGroupFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>{label}</FieldLabel>
      <RadioGroup
        value={field.state.value as string}
        onValueChange={(v) => field.handleChange(v)}
        aria-invalid={isInvalid}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2 py-0.5">
            <RadioGroupItem
              value={opt.value}
              id={`${field.name}-${opt.value}`}
            />
            <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
