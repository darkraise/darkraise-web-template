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
  // Second positional argument is the composed `aria-describedby` value
  // for the control. Existing adapters that only consume the first arg
  // keep working — JavaScript ignores extra args.
  children: (
    isInvalid: boolean,
    ariaDescribedBy: string | undefined,
  ) => ReactNode
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
  const descriptionId = description ? `${name}-description` : undefined
  const errorId = isInvalid ? `${name}-error` : undefined
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined
  return (
    <Field data-invalid={isInvalid} {...fieldProps}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {children(isInvalid, ariaDescribedBy)}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
