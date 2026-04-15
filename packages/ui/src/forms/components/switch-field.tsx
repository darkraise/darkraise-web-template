import { Switch } from "../../components/switch"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../../components/field"
import type { FieldPrimitiveProps } from "../types"

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
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className="border-border justify-between rounded-lg border p-4"
    >
      <div className="space-y-0.5">
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      <Switch
        id={name}
        checked={value}
        onCheckedChange={onChange}
        onBlur={onBlur}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
