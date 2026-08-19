"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import type { SurfaceIntensityProp } from "@lib/surface-intensity"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import { useEvent } from "@primitives/state"
import {
  useTooltip,
  TOOLTIP_DEFAULT_DELAY,
  TOOLTIP_DEFAULT_CLOSE_DELAY,
  type UseTooltipReturn,
} from "./useTooltip"
import "./tooltip.css"

interface ProviderState {
  delayDuration: number
  closeDelay: number
  skipDelayDuration: number
  disableHoverableContent: boolean
  lastClosedAt: { current: number }
  setLastClosedAt: (t: number) => void
}

const ProviderContext = React.createContext<ProviderState | null>(null)

interface TooltipProviderProps {
  /** Hover-intent gate before the tooltip appears. */
  delayDuration?: number
  /** Grace period before it closes; also the window for reaching the content. */
  closeDelay?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
  children?: React.ReactNode
}

function TooltipProvider({
  delayDuration = TOOLTIP_DEFAULT_DELAY,
  closeDelay = TOOLTIP_DEFAULT_CLOSE_DELAY,
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
      closeDelay,
      skipDelayDuration,
      disableHoverableContent,
      lastClosedAt,
      setLastClosedAt,
    }),
    [
      delayDuration,
      closeDelay,
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
      delayDuration: TOOLTIP_DEFAULT_DELAY,
      closeDelay: TOOLTIP_DEFAULT_CLOSE_DELAY,
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
  /** Overrides the provider's hover-intent gate for this tooltip. */
  delayDuration?: number
  /** Overrides the provider's close grace period for this tooltip. */
  closeDelay?: number
  disableHoverableContent?: boolean
  children?: React.ReactNode
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
  closeDelay,
  disableHoverableContent,
  children,
}: TooltipProps) {
  const provider = useProviderState()
  const effectiveDelay = delayDuration ?? provider.delayDuration
  const effectiveCloseDelay = closeDelay ?? provider.closeDelay
  const effectiveDisableHover =
    disableHoverableContent ?? provider.disableHoverableContent

  const tooltip = useTooltip({
    open,
    defaultOpen,
    onOpenChange,
    delayDuration: effectiveDelay,
    closeDelay: effectiveCloseDelay,
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
        // Keyboard focus only. A tooltip raised by focus can never be
        // dismissed by `pointerleave` — the pointer never entered the
        // trigger — so pointer-driven focus would strand it on screen. Two
        // paths hit this: the focus a click leaves behind (which the
        // provider's skip-delay window reopens instantly), and a modal
        // handing focus back here when it closes (useFocusTrap
        // `restoreFocus`), long after the pointer has moved away.
        if (!event.currentTarget.matches(":focus-visible")) return
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

export type TooltipSide = "top" | "right" | "bottom" | "left"
export type TooltipAlign = "start" | "center" | "end"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: TooltipSide
  align?: TooltipAlign
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
  /**
   * How strongly this tooltip's surface separates from the page, overriding
   * the `surfaceIntensity` theme axis. Nested non-portalled surfaces inherit
   * it; portalled content does not, because custom properties inherit
   * through the DOM tree rather than the React tree.
   */
  surfaceIntensity?: SurfaceIntensityProp
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
  surfaceIntensity,
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
      data-surface-intensity={surfaceIntensity}
      style={{
        position: floating.strategy,
        top: Math.round(floating.y ?? 0),
        left: Math.round(floating.x ?? 0),
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
