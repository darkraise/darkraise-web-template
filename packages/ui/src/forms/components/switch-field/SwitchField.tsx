import { Switch } from "@components/switch"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@components/field"
import type { FieldPrimitiveProps } from "@forms/types"

interface SwitchFieldProps extends FieldPrimitiveProps<boolean> {
  label: string
  description?: string
}

export function SwitchField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid = false,
  errors,
  label,
  description,
}: SwitchFieldProps) {
  const hasDescription = description ? "true" : undefined
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className="dr-switch-field"
      data-has-description={hasDescription}
    >
      <div className="dr-switch-field-text">
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      <Switch
        id={name}
        checked={value}
        onCheckedChange={onChange}
        onBlur={onBlur}
        aria-invalid={isInvalid}
        data-has-description={hasDescription}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
