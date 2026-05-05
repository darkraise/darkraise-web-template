import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

type BoxPadding = "none" | "sm" | "md" | "lg" | "xl" | "density"
type BoxSurface = "none" | "muted" | "card" | "accent"
type BoxRounded = "none" | "sm" | "md" | "lg" | "full"

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  padding?: BoxPadding
  bordered?: boolean
  surface?: BoxSurface
  rounded?: BoxRounded
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { className, padding, bordered, surface, rounded, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("dr-box", className)}
      data-padding={padding}
      data-bordered={bordered !== undefined ? String(bordered) : undefined}
      data-surface={surface}
      data-rounded={rounded}
      {...props}
    />
  )
})
