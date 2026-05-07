"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { useSeparator, type SeparatorOrientation } from "./useSeparator"
import "./separator.css"

interface SeparatorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "role"
> {
  orientation?: SeparatorOrientation
  decorative?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ref,
  ...props
}: SeparatorProps) {
  const ariaProps = useSeparator({ orientation, decorative })

  return (
    <div
      ref={ref}
      className={cn("dr-separator", className)}
      {...ariaProps}
      {...props}
    />
  )
}

export { Separator }
