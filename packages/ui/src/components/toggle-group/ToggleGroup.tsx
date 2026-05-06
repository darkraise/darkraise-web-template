import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { cn } from "@lib/utils"
import type { ToggleVariant, ToggleSize } from "@components/toggle"
import "./toggle-group.css"

interface ToggleGroupContextValue {
  variant?: ToggleVariant
  size?: ToggleSize
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: ToggleVariant
  size?: ToggleSize
}) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("dr-toggle-group", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ref,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  variant?: ToggleVariant
  size?: ToggleSize
}) {
  const context = React.useContext(ToggleGroupContext)
  const resolvedVariant = variant ?? context.variant ?? "default"
  const resolvedSize = size ?? context.size ?? "default"

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn("dr-toggle", className)}
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
