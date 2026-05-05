import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const boxVariants = cva("", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-2",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
      density: "p-[var(--density-container-p)]",
    },
    bordered: {
      true: "border",
      false: "",
    },
    surface: {
      none: "",
      muted: "bg-muted",
      card: "bg-card text-card-foreground",
      accent: "bg-accent text-accent-foreground",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    },
  },
})

export interface BoxProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof boxVariants> {}

export const Box = forwardRef<HTMLDivElement, BoxProps>(function Box(
  { className, padding, bordered, surface, rounded, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        boxVariants({ padding, bordered, surface, rounded }),
        className,
      )}
      {...props}
    />
  )
})
