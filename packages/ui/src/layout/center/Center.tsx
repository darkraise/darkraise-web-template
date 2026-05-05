import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

type CenterMinHeight = "none" | "screen" | "full"

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  inline?: boolean
  minHeight?: CenterMinHeight
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(function Center(
  { className, inline = false, minHeight, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("dr-center", className)}
      data-inline={String(inline)}
      data-min-height={minHeight}
      {...props}
    />
  )
})
