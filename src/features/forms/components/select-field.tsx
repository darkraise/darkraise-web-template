import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
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
  return (
    <FieldWrapper field={field} label={label} description={description}>
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
