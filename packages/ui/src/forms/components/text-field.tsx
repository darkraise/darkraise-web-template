import { Input } from "../../components/input"
import { FieldWrapper } from "./field-wrapper"
import type { FieldPrimitiveProps } from "../types"

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
}: TextFieldProps) {
  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      isInvalid={isInvalid}
      errors={errors}
    >
      {(invalid) => (
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
        />
      )}
    </FieldWrapper>
  )
}
