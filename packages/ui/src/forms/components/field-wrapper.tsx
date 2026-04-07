import type { AnyFieldApi } from "@tanstack/react-form"
import type { ReactNode, ComponentPropsWithoutRef } from "react"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../../components/field"

interface FieldWrapperProps extends Omit<
  ComponentPropsWithoutRef<typeof Field>,
  "children"
> {
  field: AnyFieldApi
  label: string
  description?: string
  children: (isInvalid: boolean) => ReactNode
}

export function FieldWrapper({
  field,
  label,
  description,
  children,
  ...fieldProps
}: FieldWrapperProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid} {...fieldProps}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {children(isInvalid)}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
