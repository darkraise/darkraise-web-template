import * as React from "react"
import { cn } from "@lib/utils"
import type { SurfaceIntensityProp } from "@lib/surface-intensity"
import "./toolbar.css"

export type ToolbarOrientation = "horizontal" | "vertical"

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: ToolbarOrientation
  /**
   * How strongly this toolbar's surface separates from the page, overriding
   * the `surfaceIntensity` theme axis. Nested non-portalled surfaces inherit
   * it; portalled content does not, because custom properties inherit
   * through the DOM tree rather than the React tree.
   */
  surfaceIntensity?: SurfaceIntensityProp
}

function Toolbar({
  className,
  orientation = "horizontal",
  surfaceIntensity,
  ...rest
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-surface-intensity={surfaceIntensity}
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
