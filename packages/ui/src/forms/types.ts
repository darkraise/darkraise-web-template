import type { AnyFieldApi } from "@tanstack/react-form"
import type { ReactNode } from "react"

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
