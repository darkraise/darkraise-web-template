import * as React from "react"

import { cn } from "@lib/utils"
import "./badge.css"

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn("dr-badge", className)}
      data-variant={variant}
      {...props}
    />
  )
}

export { Badge }
