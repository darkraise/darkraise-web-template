import * as React from "react"

import { cn } from "@lib/utils"
import "./badge.css"

export type BadgeAccentVariant =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | BadgeAccentVariant

export type BadgeSize = "sm" | "md" | "lg"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn("dr-badge", className)}
      data-variant={variant}
      data-size={size}
      {...props}
    />
  )
}

export { Badge }
