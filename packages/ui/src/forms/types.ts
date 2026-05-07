import type { ReactNode } from "react"

export interface FieldPrimitiveProps<T> {
  name: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  isInvalid?: boolean
  errors?: Array<{ message?: string } | undefined>
}

export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export interface FormActionsProps {
  submitLabel?: string
  submittingLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}
