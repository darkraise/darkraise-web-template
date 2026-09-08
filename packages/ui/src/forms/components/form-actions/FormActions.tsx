import { useUiText } from "../../../i18n/useUiText"
import { Button } from "@components/button"
import type { FormActionsProps } from "@forms/types"

export function FormActions({
  submitLabel: submitLabelLocaleProp,
  submittingLabel: submittingLabelLocaleProp,
  cancelLabel: cancelLabelLocaleProp,
  onCancel,
  isSubmitting = false,
  canSubmit = true,
}: FormActionsProps) {
  const uiText = useUiText()
  const submitLabel = submitLabelLocaleProp ?? uiText("Save")
  const submittingLabel = submittingLabelLocaleProp ?? uiText("Saving...")
  const cancelLabel = cancelLabelLocaleProp ?? uiText("Cancel")

  return (
    <div className="border-border flex items-center justify-end gap-[var(--density-stack-gap)] border-t pt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      {/* `loading` rather than a bare `disabled`: swapping the label text was
          the only signal before, and a label change on an unfocused button is
          announced to nobody. */}
      <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  )
}
