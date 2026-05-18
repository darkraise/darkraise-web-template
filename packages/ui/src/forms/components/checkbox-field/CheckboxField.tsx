import { Checkbox } from "@components/checkbox"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@components/field"
import type { FieldPrimitiveProps } from "@forms/types"

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
  disabled,
}: CheckboxFieldProps) {
  // `readOnly` is intentionally not threaded through here: a checkbox is a
  // boolean toggle, not a text field, so `readOnly` has no meaningful
  // semantic. Callers wanting a non-interactive checkbox should use
  // `disabled`.
  const hasDescription = description ? "true" : undefined
  const descriptionId = description ? `${name}-description` : undefined
  const errorId = isInvalid ? `${name}-error` : undefined
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <Field orientation="vertical" data-invalid={isInvalid}>
      <div className="dr-checkbox-field" data-has-description={hasDescription}>
        <Checkbox
          id={name}
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          onBlur={onBlur}
          aria-invalid={isInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          className="dr-checkbox-field-control"
          data-has-description={hasDescription}
        />
        <div>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && (
            <FieldDescription id={descriptionId}>
              {description}
            </FieldDescription>
          )}
        </div>
      </div>
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
