import { Textarea } from "@components/textarea"
import { FieldWrapper } from "@forms/components/field-wrapper"
import type { FieldPrimitiveProps } from "@forms/types"

interface TextareaFieldProps extends FieldPrimitiveProps<string> {
  label: string
  description?: string
  placeholder?: string
  rows?: number
}

export function TextareaField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid,
  errors,
  label,
  description,
  placeholder,
  rows = 3,
  disabled,
  readOnly,
  required,
}: TextareaFieldProps) {
  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      required={required}
      isInvalid={isInvalid}
      errors={errors}
    >
      {(invalid, ariaDescribedBy, isRequired) => (
        <Textarea
          id={name}
          placeholder={placeholder}
          rows={rows}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          aria-required={isRequired || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          readOnly={readOnly}
        />
      )}
    </FieldWrapper>
  )
}
