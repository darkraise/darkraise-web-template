import type { AnyFieldApi } from "@tanstack/react-form"
import type { FieldPrimitiveProps } from "darkraise-ui/forms"

export function fieldProps<T>(field: AnyFieldApi): FieldPrimitiveProps<T> {
  return {
    name: field.name,
    value: field.state.value as T,
    onChange: (value: T) => field.handleChange(value),
    onBlur: field.handleBlur,
    isInvalid: field.state.meta.isTouched && !field.state.meta.isValid,
    errors: field.state.meta.errors as Array<{ message?: string } | undefined>,
  }
}
