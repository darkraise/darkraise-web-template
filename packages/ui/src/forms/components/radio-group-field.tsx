import { RadioGroup, RadioGroupItem } from "../../components/radio-group"
import { Label } from "../../components/label"
import { FieldWrapper } from "./field-wrapper"
import type { BaseFieldProps } from "../types"

interface RadioGroupFieldProps extends BaseFieldProps {
  options: Array<{ label: string; value: string }>
}

export function RadioGroupField({
  field,
  label,
  description,
  options,
}: RadioGroupFieldProps) {
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
        <RadioGroup
          value={field.state.value as string}
          onValueChange={(v) => field.handleChange(v)}
          aria-invalid={isInvalid}
        >
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2 py-0.5">
              <RadioGroupItem
                value={opt.value}
                id={`${field.name}-${opt.value}`}
              />
              <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </FieldWrapper>
  )
}
