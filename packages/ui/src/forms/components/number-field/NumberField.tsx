import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
} from "@components/number-input"
import { FieldWrapper } from "@forms/components/field-wrapper"
import type { FieldPrimitiveProps } from "@forms/types"

interface NumberFieldProps extends FieldPrimitiveProps<number> {
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  precision?: number
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
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
  precision,
  formatOptions,
  locale,
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
        <NumberInput
          value={value}
          onValueChange={(d) => onChange(d.valueAsNumber)}
          min={min}
          max={max}
          step={step}
          precision={precision}
          formatOptions={formatOptions}
          locale={locale}
        >
          <NumberInputControl>
            <NumberInputField
              id={name}
              placeholder={placeholder}
              onBlur={onBlur}
              aria-invalid={invalid}
            />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>
      )}
    </FieldWrapper>
  )
}
