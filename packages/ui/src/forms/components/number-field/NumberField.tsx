import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
} from "@components/number-input"
import { FieldWrapper } from "@forms/components/field-wrapper"
import type { FieldPrimitiveProps } from "@forms/types"

type NumberFieldValue = number | undefined

interface NumberFieldProps extends FieldPrimitiveProps<NumberFieldValue> {
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
          value={value ?? Number.NaN}
          onValueChange={(d) =>
            // Surface a cleared field as undefined instead of NaN so the
            // form sees a missing value rather than a non-serializable
            // number that JSON-encodes to null.
            onChange(
              Number.isNaN(d.valueAsNumber) ? undefined : d.valueAsNumber,
            )
          }
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
