import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select"
import { FieldWrapper } from "./field-wrapper"
import type { BaseFieldProps } from "../types"

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string
  options: Array<{ label: string; value: string }>
}

export function SelectField({
  field,
  label,
  description,
  placeholder,
  options,
}: SelectFieldProps) {
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
        <Select
          value={field.state.value as string}
          onValueChange={(v) => field.handleChange(v)}
        >
          <SelectTrigger
            id={field.name}
            onBlur={field.handleBlur}
            aria-invalid={isInvalid}
          >
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
