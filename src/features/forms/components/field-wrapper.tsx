import { Label } from "@/core/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

interface FieldWrapperProps {
  field: AnyFieldApi
  label: string
  description?: string
  children: React.ReactNode
}

export function FieldWrapper({
  field,
  label,
  description,
  children,
}: FieldWrapperProps) {
  const errors = field.state.meta.isTouched ? field.state.meta.errors : []

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
      {errors.map((err) => (
        <p key={err.message} className="text-xs text-destructive">
          {err.message}
        </p>
      ))}
    </div>
  )
}
