import type { Placement } from "@floating-ui/react"
import type { PhysicalSide } from "./resolveSide"

const OPPOSITE: Record<PhysicalSide, PhysicalSide> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
}

/** The side of its trigger a popup sits on, from its resolved placement. */
export function sideOfPlacement(placement: Placement): PhysicalSide {
  return placement.split("-")[0] as PhysicalSide
}

/** The popup's edge that faces its trigger, where the arrow sits. */
export function arrowEdge(side: PhysicalSide): PhysicalSide {
  return OPPOSITE[side]
}
