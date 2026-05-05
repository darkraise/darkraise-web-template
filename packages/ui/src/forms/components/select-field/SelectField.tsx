import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/select"
import { FieldWrapper } from "../field-wrapper"
import type { FieldPrimitiveProps } from "../../types"

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
      {(invalid) => (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={name} onBlur={onBlur} aria-invalid={invalid}>
            <SelectValue placeholder={placeholder} />
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
