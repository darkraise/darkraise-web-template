import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import { FieldWrapper } from "@forms/components/field-wrapper"
import type { FieldPrimitiveProps } from "@forms/types"

interface SelectFieldProps extends FieldPrimitiveProps<string> {
  label: string
  description?: string
  placeholder?: string
  options: Array<{ label: string; value: string }>
}

export function SelectField({
  name,
  value,
  onChange,
  onBlur,
  isInvalid,
  errors,
  label,
  description,
  placeholder,
  disabled,
  options,
}: SelectFieldProps) {
  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      isInvalid={isInvalid}
      errors={errors}
    >
      {(invalid, ariaDescribedBy) => (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            id={name}
            onBlur={onBlur}
            aria-invalid={invalid}
            aria-describedby={ariaDescribedBy}
          >
            {/* Resolve the label from `options` so a preset value renders its
             *  label immediately — the Select only registers item text once
             *  its content has been opened. */}
            <SelectValue placeholder={placeholder}>
              {options.find((opt) => opt.value === value)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldWrapper>
  )
}
