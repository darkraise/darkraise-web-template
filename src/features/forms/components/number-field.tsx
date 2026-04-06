import { Input } from "@/core/components/ui/input"
import { FieldWrapper } from "./field-wrapper"
import type { BaseFieldProps } from "../types"

interface NumberFieldProps extends BaseFieldProps {
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  field,
  label,
  description,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
  return (
    <FieldWrapper field={field} label={label} description={description}>
      {(isInvalid) => (
        <Input
          id={field.name}
          type="number"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          value={field.state.value as number}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(Number(e.target.value))}
          aria-invalid={isInvalid}
        />
      )}
    </FieldWrapper>
  )
}
