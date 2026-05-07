"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import "./separator.css"

type Orientation = "horizontal" | "vertical"

interface SeparatorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "role"
> {
  orientation?: Orientation
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
  const ariaProps = decorative
    ? { role: "none" }
    : ({
        role: "separator",
        "aria-orientation": orientation === "vertical" ? "vertical" : undefined,
      } as const)

  return (
    <div
      ref={ref}
      data-orientation={orientation}
      className={cn("dr-separator", className)}
      {...ariaProps}
      {...props}
    />
  )
}

export { Separator }
