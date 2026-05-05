import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"

import { cn } from "../../lib/utils"
import "./toggle.css"

export type ToggleVariant = "default" | "outline"
export type ToggleSize = "default" | "sm" | "lg"

function Toggle({
  className,
  variant = "default",
  size = "default",
  ref,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & {
  variant?: ToggleVariant
  size?: ToggleSize
}) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn("dr-toggle", className)}
      data-variant={variant}
      data-size={size}
      {...props}
    />
  )
}
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }
