"use client"

import * as React from "react"

import { useId } from "@primitives/state"
import { Presence } from "@primitives/presence"
import { Slot } from "@primitives/slot"
import { useCollapsible, type UseCollapsibleOptions } from "./useCollapsible"

interface CollapsibleContextValue {
  open: boolean
  toggle: () => void
  disabled: boolean
  contentId: string
  triggerId: string
  state: "open" | "closed"
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null,
)

function useCollapsibleContext(consumer: string): CollapsibleContextValue {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Collapsible>`)
  return ctx
}

interface CollapsibleProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function Collapsible({
  ref,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  children,
  ...props
}: CollapsibleProps) {
  const opts: UseCollapsibleOptions = {
    open,
    defaultOpen,
    onOpenChange,
    disabled,
  }
  const c = useCollapsible(opts)
  const contentId = useId()
  const triggerId = useId()

  const ctx = React.useMemo<CollapsibleContextValue>(
    () => ({
      open: c.open,
      toggle: c.toggle,
      disabled: c.disabled,
      contentId,
      triggerId,
      state: c.state,
    }),
    [c.open, c.toggle, c.disabled, contentId, triggerId, c.state],
  )

  return (
    <div
      ref={ref}
      data-state={c.state}
      data-disabled={c.disabled ? "" : undefined}
      {...props}
    >
      <CollapsibleContext.Provider value={ctx}>
        {children}
      </CollapsibleContext.Provider>
    </div>
  )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function CollapsibleTrigger({
  ref,
  onClick,
  type,
  asChild,
  ...props
}: CollapsibleTriggerProps) {
  const ctx = useCollapsibleContext("CollapsibleTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      id={ctx.triggerId}
      aria-controls={ctx.contentId}
      aria-expanded={ctx.open}
      data-state={ctx.state}
      data-disabled={ctx.disabled ? "" : undefined}
      disabled={ctx.disabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggle()
      }}
      {...props}
    />
  )
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function CollapsibleContent({
  ref,
  forceMount,
  children,
  ...props
}: CollapsibleContentProps) {
  const ctx = useCollapsibleContext("CollapsibleContent")
  const content = (
    <div
      ref={ref}
      id={ctx.contentId}
      role="region"
      aria-labelledby={ctx.triggerId}
      data-state={ctx.state}
      hidden={!ctx.open}
      {...props}
    >
      {children}
    </div>
  )
  return (
    <Presence present={ctx.open} forceMount={forceMount}>
      {content}
    </Presence>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
