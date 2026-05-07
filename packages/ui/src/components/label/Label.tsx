import * as React from "react"

import { cn } from "@lib/utils"
import "./label.css"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  ref?: React.Ref<HTMLLabelElement>
}

function Label({ className, ref, onMouseDown, ...props }: LabelProps) {
  return (
    <label
      ref={ref}
      className={cn("dr-label", className)}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("button, input, select, textarea")) return
        onMouseDown?.(event)
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault()
        }
      }}
      {...props}
    />
  )
}

export { Label }
