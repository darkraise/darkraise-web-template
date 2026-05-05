import { Button } from "../../../components/button"
import type { FormActionsProps } from "../../types"

export function FormActions({
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  canSubmit = true,
}: FormActionsProps) {
  return (
    <div className="border-border flex items-center justify-end gap-[var(--density-stack-gap)] border-t pt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  )
}
