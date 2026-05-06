import * as React from "react"

import { cn } from "@lib/utils"
import "./input.css"

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn("dr-input", className)}
      ref={ref}
      {...props}
    />
  )
}

export { Input }
