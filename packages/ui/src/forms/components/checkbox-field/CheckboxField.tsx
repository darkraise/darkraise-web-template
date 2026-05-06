import { Checkbox } from "../../../components/checkbox"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../../../components/field"
import type { FieldPrimitiveProps } from "../../types"

interface CheckboxFieldProps extends FieldPrimitiveProps<boolean> {
  label: string
  description?: string
}

export function CheckboxField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid = false,
  errors,
  label,
  description,
}: CheckboxFieldProps) {
  const hasDescription = description ? "true" : undefined
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className="dr-checkbox-field"
      data-has-description={hasDescription}
    >
      <Checkbox
        id={name}
        checked={value}
        onCheckedChange={(checked) => onChange(checked === true)}
        onBlur={onBlur}
        aria-invalid={isInvalid}
        className="dr-checkbox-field-control"
        data-has-description={hasDescription}
      />
      <div>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
