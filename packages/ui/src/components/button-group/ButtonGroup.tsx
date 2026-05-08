import * as React from "react"
import { cn } from "@lib/utils"
import "./button-group.css"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...rest
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-orientation={orientation}
      className={cn("dr-button-group", className)}
      {...rest}
    />
  )
}

export { ButtonGroup }
