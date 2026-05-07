"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import { useEvent } from "@primitives/state"
import { useTooltip, type UseTooltipReturn } from "./useTooltip"
import "./tooltip.css"

interface ProviderState {
  delayDuration: number
  skipDelayDuration: number
  disableHoverableContent: boolean
  lastClosedAt: { current: number }
  setLastClosedAt: (t: number) => void
}

const ProviderContext = React.createContext<ProviderState | null>(null)

interface TooltipProviderProps {
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  children?: React.ReactNode
}

function TooltipProvider({
  delayDuration = 700,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  children,
}: TooltipProviderProps) {
  const lastClosedAt = React.useRef(0)
  const setLastClosedAt = useEvent((t: number) => {
    lastClosedAt.current = t
  })

  const value = React.useMemo<ProviderState>(
    () => ({
      delayDuration,
      skipDelayDuration,
      disableHoverableContent,
      lastClosedAt,
      setLastClosedAt,
    }),
    [
      delayDuration,
      skipDelayDuration,
      disableHoverableContent,
      setLastClosedAt,
    ],
  )

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  )
}

function useProviderState(): ProviderState {
  return (
    React.useContext(ProviderContext) ?? {
      delayDuration: 700,
      skipDelayDuration: 300,
      disableHoverableContent: false,
      lastClosedAt: { current: 0 },
      setLastClosedAt: () => {},
    }
  )
}

interface TooltipContextValue extends UseTooltipReturn {
  setReference: (node: HTMLElement | null) => void
  reference: HTMLElement | null
  disableHoverableContent: boolean
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function useTooltipContext(consumer: string): TooltipContextValue {
  const ctx = React.useContext(TooltipContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Tooltip>`)
  return ctx
}

interface TooltipProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  disableHoverableContent?: boolean
  children?: React.ReactNode
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  disableHoverableContent,
  children,
}: TooltipProps) {
  const provider = useProviderState()
  const effectiveDelay = delayDuration ?? provider.delayDuration
  const effectiveDisableHover =
    disableHoverableContent ?? provider.disableHoverableContent

  const tooltip = useTooltip({
    open,
    defaultOpen,
    onOpenChange,
    delayDuration: effectiveDelay,
    skipDelayDuration: provider.skipDelayDuration,
    lastClosedAtRef: provider.lastClosedAt,
    notifyClosed: () => provider.setLastClosedAt(Date.now()),
  })

  const [reference, setReference] = React.useState<HTMLElement | null>(null)

  const ctx = React.useMemo<TooltipContextValue>(
    () => ({
      ...tooltip,
      setReference,
      reference,
      disableHoverableContent: effectiveDisableHover,
    }),
    [tooltip, reference, effectiveDisableHover],
  )

  return (
    <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>
  )
}

interface TooltipTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function TooltipTrigger({
  ref,
  asChild,
  type,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...props
}: TooltipTriggerProps) {
  const ctx = useTooltipContext("TooltipTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={composeRefs(ctx.setReference as React.Ref<HTMLButtonElement>, ref)}
      type={resolvedType}
      id={ctx.triggerId}
      aria-describedby={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.state}
      onPointerEnter={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (event.pointerType === "touch") return
        ctx.scheduleOpen()
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleOpen()
      }}
      onBlur={(event: React.FocusEvent<HTMLButtonElement>) => {
        onBlur?.(event)
        if (event.defaultPrevented) return
        ctx.scheduleClose()
      }}
      {...props}
    />
  )
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function TooltipContentImpl({
  className,
  children,
  side = "top",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  avoidCollisions = true,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: Omit<TooltipContentProps, "forceMount">) {
  const ctx = useTooltipContext("TooltipContent")
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

  // Escape closes (window-level — Tooltip is non-modal, no DismissableLayer needed).
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
      role="tooltip"
      id={ctx.contentId}
      data-state={ctx.state}
      data-side={resolvedSide}
      data-align={resolvedAlign}
      style={{
        position: floating.strategy,
        top: floating.y ?? 0,
        left: floating.x ?? 0,
      }}
      className={cn("dr-tooltip-content", className)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (!ctx.disableHoverableContent) ctx.cancelSchedule()
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

function TooltipContent({ forceMount, ...props }: TooltipContentProps) {
  const ctx = useTooltipContext("TooltipContent")
  return (
    <Portal>
      <Presence present={ctx.open} forceMount={forceMount}>
        <TooltipContentImpl {...props} />
      </Presence>
    </Portal>
  )
}

interface TooltipArrowProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  ref?: React.Ref<SVGSVGElement>
}

function TooltipArrow({ width = 8, height = 4, ...props }: TooltipArrowProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      {...props}
    >
      <path d={`M0,0 L${width / 2},${height} L${width},0 Z`} />
    </svg>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
  TooltipProvider,
}
