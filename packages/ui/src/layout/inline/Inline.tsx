import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@lib/utils"

type InlineGap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "density"
type InlineAlign = "start" | "center" | "end" | "baseline" | "stretch"
type InlineJustify = "start" | "center" | "end" | "between" | "around"

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  gap?: InlineGap
  align?: InlineAlign
  justify?: InlineJustify
  wrap?: boolean
}

export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { className, gap = "md", align = "center", justify, wrap, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("dr-inline", className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap !== undefined ? String(wrap) : undefined}
      {...props}
    />
  )
})
