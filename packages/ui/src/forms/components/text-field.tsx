import { Input } from "../../components/input"
import { FieldWrapper } from "./field-wrapper"
import type { BaseFieldProps } from "../types"

interface TextFieldProps extends BaseFieldProps {
  placeholder?: string
  type?: "text" | "email" | "password" | "url"
}

export function TextField({
  field,
  label,
  description,
  placeholder,
  type = "text",
}: TextFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <FieldWrapper
      name={field.name}
      label={label}
      description={description}
      isInvalid={isInvalid}
      errors={field.state.meta.errors}
    >
      {(isInvalid) => (
        <Input
          id={field.name}
          type={type}
          placeholder={placeholder}
          value={field.state.value as string}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
      )}
    </FieldWrapper>
  )
}
