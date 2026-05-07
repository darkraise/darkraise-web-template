import * as React from "react"

export interface FloatingArrowProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  ref?: React.Ref<SVGSVGElement>
}

export function FloatingArrow({
  width = 8,
  height = 4,
  fill = "currentColor",
  ref,
  ...rest
}: FloatingArrowProps) {
  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill={fill}
      {...rest}
    >
      <path d={`M0,0 L${width / 2},${height} L${width},0 Z`} />
    </svg>
  )
}
