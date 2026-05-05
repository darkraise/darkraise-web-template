import { Input } from "../../../components/input"
import { FieldWrapper } from "../field-wrapper"
import type { FieldPrimitiveProps } from "../../types"

interface NumberFieldProps extends FieldPrimitiveProps<number> {
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid,
  errors,
  label,
  description,
  placeholder,
  min,
  max,
  step,
}: NumberFieldProps) {
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
          type="number"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-invalid={invalid}
        />
      )}
    </FieldWrapper>
  )
}
