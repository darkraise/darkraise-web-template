import * as React from "react"

import { cn } from "@lib/utils"
import { useLabel } from "./useLabel"
import "./label.css"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  ref?: React.Ref<HTMLLabelElement>
}

function Label({ className, ref, onMouseDown, ...props }: LabelProps) {
  const { onMouseDown: handleMouseDown } = useLabel({ onMouseDown })
  return (
    <label
      ref={ref}
      className={cn("dr-label", className)}
      onMouseDown={handleMouseDown}
      {...props}
    />
  )
}

export { Label }
