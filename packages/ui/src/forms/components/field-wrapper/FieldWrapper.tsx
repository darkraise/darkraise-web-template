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
  /** Marks the field required on the label and on the control itself. */
  required?: boolean
  isInvalid?: boolean
  errors?: Array<{ message?: string } | undefined>
  // Second positional argument is the composed `aria-describedby` value
  // for the control; the third is `required`, so an adapter can put it on
  // the control as well as the label. Existing adapters that only consume
  // the earlier args keep working — JavaScript ignores extra args.
  children: (
    isInvalid: boolean,
    ariaDescribedBy: string | undefined,
    required: boolean,
  ) => ReactNode
}

export function FieldWrapper({
  name,
  label,
  description,
  required = false,
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
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {children(isInvalid, ariaDescribedBy, required)}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
