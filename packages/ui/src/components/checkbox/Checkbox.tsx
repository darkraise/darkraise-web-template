"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@lib/utils"
import "./checkbox.css"

export type CheckboxSize = "sm" | "default" | "lg"

const checkIconSize: Record<CheckboxSize, string> = {
  sm: "h-3 w-3",
  default: "h-4 w-4",
  lg: "h-4.5 w-4.5",
}

function Checkbox({
  className,
  size = "default",
  ref,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  size?: CheckboxSize
}) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn("dr-checkbox", className)}
      data-size={size}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("grid place-content-center text-current")}
      >
        <Check className={checkIconSize[size]} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
