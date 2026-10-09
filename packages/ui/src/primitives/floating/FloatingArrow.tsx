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

function arrowPath(side: PhysicalSide, width: number, height: number) {
  switch (side) {
    case "top":
      return `M0,0 L${width / 2},${height} L${width},0 Z`
    case "bottom":
      return `M0,${height} L${width / 2},0 L${width},${height} Z`
    case "left":
      return `M0,0 L${height},${width / 2} L0,${width} Z`
    case "right":
      return `M${height},0 L0,${width / 2} L${height},${width} Z`
  }
}

export function FloatingArrow({
  width = 8,
  height = 4,
  side = "top",
  fill = "currentColor",
  ref,
  ...rest
}: FloatingArrowProps) {
  // Beside a left or right popup the base runs vertically, so the box turns
  // with the triangle and the arrow middleware centres it on its real height.
  const vertical = side === "top" || side === "bottom"
  const boxWidth = vertical ? width : height
  const boxHeight = vertical ? height : width
  return (
    <svg
      ref={ref}
      width={boxWidth}
      height={boxHeight}
      viewBox={`0 0 ${boxWidth} ${boxHeight}`}
      fill={fill}
      {...rest}
    >
      <path d={arrowPath(side, width, height)} />
    </svg>
  )
}
