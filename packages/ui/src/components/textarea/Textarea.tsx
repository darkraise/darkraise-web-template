import * as React from "react"

import { cn } from "../../lib/utils"
import "./textarea.css"

function Textarea({
  className,
  ref,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn("dr-textarea", className)} ref={ref} {...props} />
  )
}

export { Textarea }
