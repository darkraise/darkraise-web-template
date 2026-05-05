import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "../../lib/utils"

type SectionSpacing = "none" | "sm" | "md" | "lg" | "xl" | "density"

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing
  bordered?: boolean
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className, spacing = "md", bordered = false, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn("dr-section", className)}
      data-spacing={spacing}
      data-bordered={String(bordered)}
      {...props}
    />
  )
})
