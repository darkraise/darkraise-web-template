import * as React from "react"

import { cn } from "../../lib/utils"

function Textarea({
  className,
  ref,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "glass border-input bg-card text-card-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[72px] w-full border px-[var(--density-input-px)] py-[var(--density-input-py)] text-base focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}

export { Textarea }
