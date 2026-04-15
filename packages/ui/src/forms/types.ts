import type { AnyFieldApi } from "@tanstack/react-form"
import type { ReactNode } from "react"

export interface FieldPrimitiveProps<T> {
  name: string
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  isInvalid?: boolean
  errors?: Array<{ message?: string } | undefined>
}

// Kept during migration; removed in Task 4 once no file consumes it.
export interface BaseFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export interface FormActionsProps {
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
}
