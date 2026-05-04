import * as React from "react"

import { cn } from "../lib/utils"

function Input({
  className,
  type,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "glass border-input bg-card text-card-foreground ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full border px-[var(--density-input-px)] py-[var(--density-input-py)] text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-ms-reveal]:dark:invert [&::-webkit-calendar-picker-indicator]:dark:invert",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

export { Input }
