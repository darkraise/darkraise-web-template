import type { ComponentPropsWithoutRef, ReactNode } from "react"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@components/field"

interface FieldWrapperProps extends Omit<
  ComponentPropsWithoutRef<typeof Field>,
  "children"
> {
  name: string
  label: string
  description?: string
  isInvalid?: boolean
  errors?: Array<{ message?: string } | undefined>
  children: (isInvalid: boolean) => ReactNode
}

export function FieldWrapper({
  name,
  label,
  description,
  isInvalid = false,
  errors,
  children,
  ...fieldProps
}: FieldWrapperProps) {
  return (
    <Field data-invalid={isInvalid} {...fieldProps}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      {children(isInvalid)}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
