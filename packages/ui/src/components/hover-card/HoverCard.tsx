"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import { useHoverCard, type UseHoverCardReturn } from "./useHoverCard"
import "./hover-card.css"

interface HoverCardContextValue extends UseHoverCardReturn {
  setReference: (node: HTMLElement | null) => void
  reference: HTMLElement | null
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null)

function useHoverCardContext(consumer: string): HoverCardContextValue {
  const ctx = React.useContext(HoverCardContext)
  if (!ctx) throw new Error(`${consumer} must be used within <HoverCard>`)
  return ctx
}

interface HoverCardProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
  children?: React.ReactNode
}

function HoverCard({
  open,
  defaultOpen,
  onOpenChange,
  openDelay,
  closeDelay,
  children,
}: HoverCardProps) {
  const hc = useHoverCard({
    open,
    defaultOpen,
    onOpenChange,
    openDelay,
    closeDelay,
  })
  const [reference, setReference] = React.useState<HTMLElement | null>(null)

  const ctx = React.useMemo<HoverCardContextValue>(
    () => ({ ...hc, setReference, reference }),
    [hc, reference],
  )

  return (
    <HoverCardContext.Provider value={ctx}>
      {children}
    </HoverCardContext.Provider>
  )
}

interface HoverCardTriggerProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string
  asChild?: boolean
  ref?: React.Ref<HTMLAnchorElement>
}

function HoverCardTrigger({
  ref,
  asChild,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: HoverCardTriggerProps) {
  const ctx = useHoverCardContext("HoverCardTrigger")
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={composeRefs(ctx.setReference as React.Ref<HTMLAnchorElement>, ref)}
      id={ctx.triggerId}
      data-state={ctx.state}
      onPointerEnter={(event: React.PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (event.pointerType === "touch") return
        ctx.scheduleOpen()
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLAnchorElement>) => {
        onPointerLeave?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      onFocus={(event: React.FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleOpen()
      }}
      onBlur={(event: React.FocusEvent<HTMLAnchorElement>) => {
        onBlur?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      {...props}
    />
  )
}

interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function HoverCardContentImpl({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  avoidCollisions = true,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: Omit<HoverCardContentProps, "forceMount">) {
  const ctx = useHoverCardContext("HoverCardContent")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  const placement = (
    align === "center" ? side : `${side}-${align}`
  ) as import("@floating-ui/react").Placement
  const floating = useFloating({
    placement,
    sideOffset,
    alignOffset,
    avoidCollisions,
    collisionPadding,
  })

  const setReferenceFloat = floating.refs.setReference
  React.useEffect(() => {
    setReferenceFloat(ctx.reference ?? null)
  }, [ctx.reference, setReferenceFloat])

  React.useEffect(() => {
    if (!ctx.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx.setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [ctx.open, ctx])

  const [resolvedSide, resolvedAlign] = React.useMemo(() => {
    const p = floating.placement
    const [s, a = "center"] = p.split("-")
    return [s, a]
  }, [floating.placement])

  return (
    <div
      ref={composeRefs(localRef, floating.refs.setFloating, ref)}
      id={ctx.contentId}
      data-state={ctx.state}
      data-side={resolvedSide}
      data-align={resolvedAlign}
      style={{
        position: floating.strategy,
        top: floating.y ?? 0,
        left: floating.x ?? 0,
      }}
      className={cn("dr-hover-card-content", className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        ctx.cancelSchedule()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

function HoverCardContent({ forceMount, ...props }: HoverCardContentProps) {
  const ctx = useHoverCardContext("HoverCardContent")
  if (!forceMount && !ctx.open) return null
  return (
    <Portal>
      <Presence present={ctx.open} forceMount={forceMount}>
        <HoverCardContentImpl {...props} />
      </Presence>
    </Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
