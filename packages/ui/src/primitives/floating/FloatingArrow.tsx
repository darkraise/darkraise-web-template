import * as React from "react"
import type { PhysicalSide } from "./resolveSide"

export interface FloatingArrowProps extends React.SVGAttributes<SVGSVGElement> {
  /** The arrow's base, along the popup's edge. */
  width?: number
  /** How far the arrow reaches out from the popup's edge. */
  height?: number
  /** The side of its trigger the popup sits on; the arrow points back at it. */
  side?: PhysicalSide
  ref?: React.Ref<SVGSVGElement>
}

/** The two outer edges, from one end of the base through the tip. */
function edgePath(side: PhysicalSide, width: number, height: number) {
  switch (side) {
    case "top":
      return `M0,0 L${width / 2},${height} L${width},0`
    case "bottom":
      return `M0,${height} L${width / 2},0 L${width},${height}`
    case "left":
      return `M0,0 L${height},${width / 2} L0,${width}`
    case "right":
      return `M${height},0 L0,${width / 2} L${height},${width}`
  }
}

export function FloatingArrow({
  width = 8,
  height = 4,
  side = "top",
  ref,
  ...rest
}: FloatingArrowProps) {
  // Beside a left or right popup the base runs vertically, so the box turns
  // with the triangle and the arrow middleware centres it on its real height.
  const vertical = side === "top" || side === "bottom"
  const boxWidth = vertical ? width : height
  const boxHeight = vertical ? height : width
  const edge = edgePath(side, width, height)
  // The svg carries the paint, so a class or a `fill` on it reaches the
  // triangle; each path opts out of the paint it must not take. The middle
  // path paints nothing unless a class gives it a tint over the fill.
  return (
    <svg
      ref={ref}
      width={boxWidth}
      height={boxHeight}
      viewBox={`0 0 ${boxWidth} ${boxHeight}`}
      {...rest}
    >
      <path d={`${edge} Z`} stroke="none" />
      <path d={`${edge} Z`} stroke="none" fill="none" />
      <path d={edge} fill="none" />
    </svg>
  )
}
