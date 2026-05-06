import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@lib/utils"

type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "density"
type StackAlign = "start" | "center" | "end" | "stretch"
type StackJustify = "start" | "center" | "end" | "between" | "around"

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: StackGap
  align?: StackAlign
  justify?: StackJustify
  wrap?: boolean
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { className, gap = "md", align, justify, wrap, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("dr-stack", className)}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap !== undefined ? String(wrap) : undefined}
      {...props}
    />
  )
})
