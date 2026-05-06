import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@lib/utils"

type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "prose" | "full"
type ContainerPadding = "none" | "sm" | "md" | "lg" | "density"

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize
  padding?: ContainerPadding
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container(
    { className, size = "lg", padding = "md", ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("dr-container", className)}
        data-size={size}
        data-padding={padding}
        {...props}
      />
    )
  },
)
