import { Checkbox } from "../../components/checkbox"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../../components/field"
import type { AnyFieldApi } from "@tanstack/react-form"

interface CheckboxFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export function CheckboxField({
  field,
  label,
  description,
}: CheckboxFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className={description ? "items-start" : ""}
    >
      <Checkbox
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        className={description ? "mt-0.5" : ""}
      />
      <div>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
