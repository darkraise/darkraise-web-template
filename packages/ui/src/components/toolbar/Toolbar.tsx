import * as React from "react"
import { cn } from "@lib/utils"
import type { SurfaceFill } from "@lib/surface-fill"
import "./toolbar.css"

export type ToolbarOrientation = "horizontal" | "vertical"

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: ToolbarOrientation
  /** Which plane the surface paints; nested non-portalled surfaces inherit it. */
  surface?: SurfaceFill
}

function Toolbar({
  className,
  orientation = "horizontal",
  surface,
  ...rest
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-surface-fill={surface}
      className={cn("dr-toolbar", className)}
      {...rest}
    />
  )
}

function ToolbarSeparator({
  className,
  orientation = "vertical",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-orientation={orientation}
      className={cn("dr-toolbar-separator", className)}
      {...rest}
    />
  )
}

export { Toolbar, ToolbarSeparator }
