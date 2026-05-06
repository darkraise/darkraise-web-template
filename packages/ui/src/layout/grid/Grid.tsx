import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@lib/utils"

type GridCols = 1 | 2 | 3 | 4 | 6 | 12
type GridGap = "none" | "xs" | "sm" | "md" | "lg" | "xl"

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols
  responsive?: boolean
  gap?: GridGap
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, cols = 1, gap = "md", responsive = true, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("dr-grid", className)}
      data-cols={cols}
      data-gap={gap}
      data-responsive={String(responsive)}
      {...props}
    />
  )
})
