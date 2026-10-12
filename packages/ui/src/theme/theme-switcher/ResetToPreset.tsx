import { RotateCcw } from "lucide-react"
import { Button } from "@components/button"
import { useUiLabels } from "@labels"
import { useTheme } from "@theme/useTheme"

/**
 * The reset action under the Preset control. It renders only while the user
 * overrides something the active preset or style sets.
 */
export function ResetToPreset() {
  const labels = useUiLabels()
  const theme = useTheme()

  if (!theme.canResetToPreset) return null

  return (
    <div className="dr-theme-switcher-reset">
      <Button
        variant="ghost"
        size="sm"
        onClick={(event) => {
          // The button leaves with the last override. Focus moves to the
          // active preset in the row above first, so it does not fall out of
          // the panel.
          event.currentTarget.parentElement?.previousElementSibling
            ?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')
            ?.focus()
          theme.resetToPreset()
        }}
      >
        <RotateCcw className="dr-theme-switcher-row-icon" aria-hidden="true" />
        {labels.theme.resetToPreset}
      </Button>
    </div>
  )
}
