import { Switch } from "@/core/components/ui/switch"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/core/components/ui/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface SwitchFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export function SwitchField({ field, label, description }: SwitchFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className="border-border justify-between rounded-lg border p-4"
    >
      <div className="space-y-0.5">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      <Switch
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
