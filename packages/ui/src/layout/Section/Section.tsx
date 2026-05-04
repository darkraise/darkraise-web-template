import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const sectionVariants = cva("", {
  variants: {
    spacing: {
      none: "py-0",
      sm: "py-4",
      md: "py-8",
      lg: "py-12",
      xl: "py-16",
      density: "py-[var(--density-container-p)]",
    },
    bordered: {
      true: "border-b last:border-b-0",
      false: "",
    },
  },
  defaultVariants: {
    spacing: "md",
    bordered: false,
  },
})

export interface SectionProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className, spacing, bordered, ...props },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(sectionVariants({ spacing, bordered }), className)}
      {...props}
    />
  )
})
