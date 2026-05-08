import * as React from "react"
import { cn } from "@lib/utils"
import "./toolbar.css"

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

function Toolbar({
  className,
  orientation = "horizontal",
  ...rest
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      data-orientation={orientation}
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
