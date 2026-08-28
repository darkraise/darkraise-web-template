import { Input } from "@components/input"
import { FieldWrapper } from "@forms/components/field-wrapper"
import type { FieldPrimitiveProps } from "@forms/types"

interface TextFieldProps extends FieldPrimitiveProps<string> {
  label: string
  description?: string
  placeholder?: string
  type?: "text" | "email" | "password" | "url"
}

export function TextField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid,
  errors,
  label,
  description,
  placeholder,
  type = "text",
  disabled,
  readOnly,
  required,
}: TextFieldProps) {
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
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
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
