import * as React from "react"
import { arrowEdge } from "./arrowSide"
import type { PhysicalSide } from "./resolveSide"

/**
 * Publishes how far a mounted arrow reaches past its popup's edge on the
 * side facing the trigger, and 0 once it unmounts. The arrow is placed
 * against the popup's padding box, so it covers the border on that edge and
 * only the rest of its height reaches out.
 */
export function useArrowReach(
  setArrowReach: ((reach: number) => void) | undefined,
  popup: Element | null,
  side: PhysicalSide,
  height: number,
) {
  React.useLayoutEffect(() => {
    if (!setArrowReach) return
    const border = popup
      ? parseFloat(
          getComputedStyle(popup).getPropertyValue(
            `border-${arrowEdge(side)}-width`,
          ),
        ) || 0
      : 0
    setArrowReach(Math.max(0, height - border))
    return () => setArrowReach(0)
  }, [setArrowReach, popup, side, height])
}
