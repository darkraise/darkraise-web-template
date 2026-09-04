import { useCallback } from "react"
import type { KeyboardEvent } from "react"

const DEFAULT_STEP_PERCENT = 5

export interface SeparatorA11yOptions {
  /** Axis the panels are arranged along, not the separator's own axis. */
  orientation: "horizontal" | "vertical"
  valueNow?: number
  step?: number
  disabled?: boolean
  onNudge: (deltaPercent: number) => void
  /**
   * Home and End jump the separator to its extremes. Optional because
   * `Resizable` has never bound those keys, and extracting this hook must
   * not quietly give it a behaviour it did not have.
   */
  onJump?: (edge: "min" | "max") => void
}

export interface SeparatorA11yProps {
  role: "separator"
  tabIndex: number
  "aria-orientation": "horizontal" | "vertical"
  "aria-valuenow": number | undefined
  "aria-valuemin": number
  "aria-valuemax": number
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

/**
 * Keyboard and ARIA behaviour for a resize separator, shared by `Resizable`
 * and the split-panel shell. Only the behaviour is shared: the two keep their
 * own layout mechanics, because the shell places its handle in a grid area
 * while `Resizable` sizes panels by percentage inside a flex group.
 */
export function useSeparatorA11y({
  orientation,
  valueNow,
  step = DEFAULT_STEP_PERCENT,
  disabled = false,
  onNudge,
  onJump,
}: SeparatorA11yOptions): SeparatorA11yProps {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (disabled) return
      const decrease = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp"
      const increase = orientation === "horizontal" ? "ArrowRight" : "ArrowDown"

      if (event.key === decrease) {
        event.preventDefault()
        onNudge(-step)
      } else if (event.key === increase) {
        event.preventDefault()
        onNudge(step)
      } else if (onJump && event.key === "Home") {
        event.preventDefault()
        onJump("min")
      } else if (onJump && event.key === "End") {
        event.preventDefault()
        onJump("max")
      }
    },
    [disabled, orientation, step, onNudge, onJump],
  )

  return {
    role: "separator",
    tabIndex: disabled ? -1 : 0,
    // A horizontally-arranged group is divided by a vertical separator, so
    // the reported orientation is the perpendicular of the group's.
    "aria-orientation":
      orientation === "horizontal" ? "vertical" : "horizontal",
    "aria-valuenow": valueNow,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    onKeyDown,
  }
}
