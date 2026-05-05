import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const inlineVariants = cva("flex flex-row", {
  variants: {
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      density: "gap-[var(--density-stack-gap)]",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "center",
  },
})

export interface InlineProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof inlineVariants> {}

export const Inline = forwardRef<HTMLDivElement, InlineProps>(function Inline(
  { className, gap, align, justify, wrap, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(inlineVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  )
})
