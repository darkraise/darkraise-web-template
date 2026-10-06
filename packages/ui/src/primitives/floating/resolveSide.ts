import type { Placement } from "@floating-ui/react"
import { getDirection } from "@lib/direction"

export type PhysicalSide = "top" | "right" | "bottom" | "left"
export type LogicalSide = PhysicalSide | "start" | "end"
export type PopupAlign = "start" | "center" | "end"

/**
 * Resolves `start` and `end` to a physical side from the reference
 * element's computed direction: `start` is left under LTR and right under
 * RTL. Physical sides pass through.
 */
export function resolveSide(
  side: LogicalSide,
  reference: Element | null | undefined,
): PhysicalSide {
  if (side !== "start" && side !== "end") return side
  const ltr = getDirection(reference) === "ltr"
  return (side === "start") === ltr ? "left" : "right"
}

/** The floating-ui placement for a physical side and an alignment. */
export function placementOf(side: PhysicalSide, align: PopupAlign): Placement {
  return align === "center" ? side : `${side}-${align}`
}
