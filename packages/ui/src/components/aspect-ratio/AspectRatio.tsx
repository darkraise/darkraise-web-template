import * as React from "react"

import { cn } from "@lib/utils"
import { useAspectRatio } from "./useAspectRatio"
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
  const { wrapperStyle, contentStyle } = useAspectRatio({ ratio })
  return (
    <div style={wrapperStyle} data-aspect-ratio-wrapper="">
      <div
        ref={ref}
        className={cn("dr-aspect-ratio", className)}
        {...props}
        style={{ ...style, ...contentStyle }}
      />
    </div>
  )
}

export { AspectRatio }
