import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@lib/utils"
import "./switch.css"

function Switch({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      className={cn("dr-switch peer", className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb className="dr-switch-thumb" />
    </SwitchPrimitives.Root>
  )
}

export { Switch }
