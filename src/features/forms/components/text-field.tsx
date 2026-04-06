import { Input } from "@/core/components/ui/input"
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
  return (
    <FieldWrapper field={field} label={label} description={description}>
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
