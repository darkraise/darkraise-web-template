import { RadioGroup, RadioGroupItem } from "../../../components/radio-group"
import { Label } from "../../../components/label"
import { FieldWrapper } from "../field-wrapper"
import type { FieldPrimitiveProps } from "../../types"

interface RadioGroupFieldProps extends FieldPrimitiveProps<string> {
  label: string
  description?: string
  options: Array<{ label: string; value: string }>
}

export function RadioGroupField({
  name,
  value,
  onChange,
  isInvalid,
  errors,
  label,
  description,
  options,
}: RadioGroupFieldProps) {
  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      isInvalid={isInvalid}
      errors={errors}
    >
      {(invalid) => (
        <RadioGroup
          value={value}
          onValueChange={onChange}
          aria-invalid={invalid}
        >
          {options.map((opt) => (
            <div key={opt.value} className="dr-radio-group-field-option">
              <RadioGroupItem value={opt.value} id={`${name}-${opt.value}`} />
              <Label htmlFor={`${name}-${opt.value}`}>{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </FieldWrapper>
  )
}
