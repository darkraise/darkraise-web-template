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
  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className={description ? "items-start" : ""}
    >
      <Checkbox
        id={name}
        checked={value}
        onCheckedChange={(checked) => onChange(checked === true)}
        onBlur={onBlur}
        aria-invalid={isInvalid}
        className={description ? "mt-0.5" : ""}
      />
      <div>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </div>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
