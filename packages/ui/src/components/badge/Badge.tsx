import * as React from "react"

import { cn } from "@lib/utils"
import type { AccentHue } from "@lib/accent-hues"
import "./badge.css"

export type BadgeAccentVariant = AccentHue

export type BadgeStatusVariant =
  | "success"
  | "warning"
  | "info"
  | "destructive-subtle"
  | "success-subtle"
  | "warning-subtle"
  | "info-subtle"

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | BadgeStatusVariant
  | BadgeAccentVariant

export type BadgeSize = "sm" | "default" | "lg"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

function Badge({
  className,
  variant = "default",
  size = "default",
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
