import { Textarea } from "../../components/textarea"
import { FieldWrapper } from "./field-wrapper"
import type { BaseFieldProps } from "../types"

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string
  rows?: number
}

export function TextareaField({
  field,
  label,
  description,
  placeholder,
  rows = 3,
}: TextareaFieldProps) {
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
        <Textarea
          id={field.name}
          placeholder={placeholder}
          rows={rows}
          value={field.state.value as string}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
      )}
    </FieldWrapper>
  )
}
