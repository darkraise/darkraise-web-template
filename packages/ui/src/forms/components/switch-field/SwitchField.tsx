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
  disabled,
}: SwitchFieldProps) {
  // `readOnly` is intentionally not threaded through here: a switch is a
  // boolean toggle, not a text field, so `readOnly` has no meaningful
  // semantic. Callers wanting a non-interactive switch should use
  // `disabled`.
  const hasDescription = description ? "true" : undefined
  const descriptionId = description ? `${name}-description` : undefined
  const errorId = isInvalid ? `${name}-error` : undefined
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <Field orientation="vertical" data-invalid={isInvalid}>
      <div className="dr-switch-field" data-has-description={hasDescription}>
        <div className="dr-switch-field-text">
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && (
            <FieldDescription id={descriptionId}>
              {description}
            </FieldDescription>
          )}
        </div>
        <Switch
          id={name}
          checked={value}
          onCheckedChange={onChange}
          onBlur={onBlur}
          aria-invalid={isInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          data-has-description={hasDescription}
        />
      </div>
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
