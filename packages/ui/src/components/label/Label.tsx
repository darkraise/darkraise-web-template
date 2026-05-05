import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "../../lib/utils"
import "./label.css"

function Label({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("dr-label", className)}
      {...props}
    />
  )
}

export { Label }
