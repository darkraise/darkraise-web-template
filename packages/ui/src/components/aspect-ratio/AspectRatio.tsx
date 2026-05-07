import * as React from "react"

import { cn } from "@lib/utils"
import "./aspect-ratio.css"

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number
  ref?: React.Ref<HTMLDivElement>
}

function AspectRatio({
  className,
  ratio = 1,
  style,
  ref,
  ...props
}: AspectRatioProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${100 / ratio}%`,
      }}
      data-aspect-ratio-wrapper=""
    >
      <div
        ref={ref}
        className={cn("dr-aspect-ratio", className)}
        {...props}
        style={{
          ...style,
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />
    </div>
  )
}

export { AspectRatio }
