import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const centerVariants = cva("items-center justify-center", {
  variants: {
    inline: {
      true: "inline-flex",
      false: "flex",
    },
    minHeight: {
      none: "",
      screen: "min-h-screen",
      full: "min-h-full",
    },
  },
  defaultVariants: {
    inline: false,
  },
})

export interface CenterProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof centerVariants> {}

export const Center = forwardRef<HTMLDivElement, CenterProps>(function Center(
  { className, inline, minHeight, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(centerVariants({ inline, minHeight }), className)}
      {...props}
    />
  )
})
