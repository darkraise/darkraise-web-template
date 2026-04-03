import { Checkbox } from "@/core/components/ui/checkbox"
import { Label } from "@/core/components/ui/label"
import type { AnyFieldApi } from "@tanstack/react-form"

interface CheckboxFieldProps {
  field: AnyFieldApi
  label: string
  description?: string
}

export function CheckboxField({
  field,
  label,
  description,
}: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
      <div className="space-y-1">
        <Label htmlFor={field.name}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
