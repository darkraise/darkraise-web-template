import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-sm font-medium ring-offset-background transition-[background-image,background-color,border-color,color,text-decoration-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "btn-glass-hue text-primary-foreground [--hue:hsl(var(--primary))]",
        destructive:
          "btn-glass-hue text-destructive-foreground [--hue:hsl(var(--destructive))]",
        outline:
          "btn-glass-neutral btn-glass-neutral--accent-border border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "btn-glass-neutral bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "btn-ghost-glass border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[var(--density-button-px)] py-[var(--density-button-py)]",
        sm: "px-[var(--density-button-px-sm)] py-[var(--density-button-py-sm)]",
        lg: "px-[var(--density-button-px-lg)] py-[var(--density-button-py-lg)]",
        icon: "aspect-square w-[var(--density-cell)] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}

export { Button, buttonVariants }
