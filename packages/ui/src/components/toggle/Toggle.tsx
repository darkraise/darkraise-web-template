import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const toggleVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:border-primary data-[state=on]:shadow-none data-[state=on]:hover:bg-primary/10 data-[state=on]:hover:text-primary",
      },
      size: {
        default:
          "px-2.5 py-[var(--density-button-py)] aspect-auto min-w-[var(--density-cell)]",
        sm: "px-1.5 py-[var(--density-button-py-sm)] min-w-[var(--density-cell-sm)]",
        lg: "px-4 py-[var(--density-button-py-lg)] min-w-[var(--density-cell-lg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ref,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}
Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
