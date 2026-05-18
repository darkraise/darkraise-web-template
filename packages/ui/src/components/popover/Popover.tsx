"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { useFocusTrap } from "@primitives/focus-trap"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating, FloatingArrow } from "@primitives/floating"
import {
  usePopover,
  placementFromSideAlign,
  type PopoverAlign,
  type PopoverSide,
  type UsePopoverReturn,
} from "./usePopover"
import "./popover.css"

interface PopoverContextValue extends UsePopoverReturn {
  setReference: (node: HTMLElement | null) => void
  setAnchor: (node: HTMLElement | null) => void
  reference: HTMLElement | null
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext(consumer: string): PopoverContextValue {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Popover>`)
  return ctx
}

interface PopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  children?: React.ReactNode
}

function Popover({
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
  children,
}: PopoverProps) {
  const popover = usePopover({ open, defaultOpen, onOpenChange, modal })
  const [reference, setReference] = React.useState<HTMLElement | null>(null)
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null)

  const ctx = React.useMemo<PopoverContextValue>(
    () => ({
      ...popover,
      setReference,
      setAnchor,
      reference: anchor ?? reference,
    }),
    [popover, anchor, reference],
  )

  return (
    <PopoverContext.Provider value={ctx}>{children}</PopoverContext.Provider>
  )
}

interface PopoverAnchorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function PopoverAnchor({ ref, asChild, ...props }: PopoverAnchorProps) {
  const ctx = usePopoverContext("PopoverAnchor")
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      ref={composeRefs(ctx.setAnchor as React.Ref<HTMLDivElement>, ref)}
      {...props}
    />
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function PopoverTrigger({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: PopoverTriggerProps) {
  const ctx = usePopoverContext("PopoverTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={composeRefs(ctx.setReference as React.Ref<HTMLButtonElement>, ref)}
      type={resolvedType}
      id={ctx.triggerId}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.state}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggle()
      }}
      {...props}
    />
  )
}

interface PopoverPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function PopoverPortal({
  container,
  forceMount,
  children,
}: PopoverPortalProps) {
  void usePopoverContext("PopoverPortal")
  void forceMount
  return <Portal container={container}>{children}</Portal>
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: PopoverSide
  align?: PopoverAlign
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  forceMount?: boolean
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
  ref?: React.Ref<HTMLDivElement>
}

function PopoverContentImpl({
  className,
  children,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  avoidCollisions = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...rest
}: Omit<PopoverContentProps, "forceMount">) {
  const ctx = usePopoverContext("PopoverContent")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  const placement = placementFromSideAlign(side, align)
  const floating = useFloating({
    placement,
    sideOffset,
    alignOffset,
    avoidCollisions,
    collisionPadding,
  })

  // Bind the floating reference to whichever (anchor || trigger) the
  // Popover root is tracking.
  const setReferenceFloat = floating.refs.setReference
  React.useEffect(() => {
    setReferenceFloat(ctx.reference ?? null)
  }, [ctx.reference, setReferenceFloat])

  const onOpenAutoFocusHandler = useEventLike(onOpenAutoFocus)
  const onCloseAutoFocusHandler = useEventLike(onCloseAutoFocus)
  const onCloseAutoFocusRef = React.useRef(onCloseAutoFocusHandler)
  React.useEffect(() => {
    onCloseAutoFocusRef.current = onCloseAutoFocusHandler
  })

  // open auto focus
  React.useEffect(() => {
    if (!ctx.open) return
    const event = new Event("openAutoFocus", { cancelable: true })
    onOpenAutoFocusHandler?.(event)
    if (event.defaultPrevented) return
    queueMicrotask(() => {
      localRef.current?.focus({ preventScroll: true })
    })
  }, [ctx.open, onOpenAutoFocusHandler])

  // close auto focus — read the latest handler from a ref so the cleanup
  // only fires on actual unmount, not whenever the caller re-renders with
  // an inline arrow that gives `onCloseAutoFocus` a new identity.
  React.useEffect(() => {
    return () => {
      const event = new Event("closeAutoFocus", { cancelable: true })
      onCloseAutoFocusRef.current?.(event)
    }
  }, [])

  useFocusTrap(localRef, {
    disabled: !ctx.open || !ctx.modal,
    loop: true,
    restoreFocus: true,
  })

  const [resolvedSide, resolvedAlign] = React.useMemo(() => {
    const p = floating.placement
    const [s, a = "center"] = p.split("-") as [PopoverSide, PopoverAlign?]
    return [s, a]
  }, [floating.placement])

  return (
    <DismissableLayer
      onPointerDownOutside={(event) => {
        onPointerDownOutside?.(event)
        onInteractOutside?.(event)
        if (event.defaultPrevented) return
        if (
          event.target instanceof Node &&
          ctx.reference?.contains(event.target)
        )
          return
        ctx.setOpen(false)
      }}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(false)
      }}
      onFocusOutside={(event) => {
        onInteractOutside?.(event)
      }}
    >
      <div
        ref={composeRefs(localRef, floating.refs.setFloating, ref)}
        id={ctx.contentId}
        data-state={ctx.state}
        data-side={resolvedSide}
        data-align={resolvedAlign}
        tabIndex={-1}
        style={{
          position: floating.strategy,
          top: floating.y ?? 0,
          left: floating.x ?? 0,
        }}
        className={cn("dr-popover-content", className)}
        {...rest}
      >
        <PopoverFloatingProvider value={floating}>
          {children}
        </PopoverFloatingProvider>
      </div>
    </DismissableLayer>
  )
}

function useEventLike<T extends (...args: never[]) => void>(
  cb: T | undefined,
): T | undefined {
  const ref = React.useRef(cb)
  React.useLayoutEffect(() => {
    ref.current = cb
  })
  return React.useMemo<T | undefined>(() => {
    if (!cb) return undefined
    return ((...args: never[]) => ref.current?.(...args)) as T
  }, [cb])
}

const FloatingContext = React.createContext<ReturnType<
  typeof useFloating
> | null>(null)

function PopoverFloatingProvider({
  value,
  children,
}: {
  value: ReturnType<typeof useFloating>
  children: React.ReactNode
}) {
  return (
    <FloatingContext.Provider value={value}>
      {children}
    </FloatingContext.Provider>
  )
}

function PopoverContent({ forceMount, ...props }: PopoverContentProps) {
  const ctx = usePopoverContext("PopoverContent")
  return (
    <PopoverPortal forceMount={forceMount}>
      <Presence present={ctx.open} forceMount={forceMount}>
        <PopoverContentImpl {...props} />
      </Presence>
    </PopoverPortal>
  )
}

interface PopoverArrowProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number
  height?: number
  ref?: React.Ref<SVGSVGElement>
}

function PopoverArrow({ ref, ...props }: PopoverArrowProps) {
  const floating = React.useContext(FloatingContext)
  const arrowData = floating?.middlewareData.arrow
  return (
    <FloatingArrow
      ref={composeRefs(floating?.arrowRef as React.Ref<SVGSVGElement>, ref)}
      style={{
        position: "absolute",
        left: arrowData?.x,
        top: arrowData?.y,
      }}
      {...props}
    />
  )
}

interface PopoverCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function PopoverClose({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: PopoverCloseProps) {
  const ctx = usePopoverContext("PopoverClose")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(false)
      }}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverAnchor,
  PopoverClose,
  usePopoverContext,
}
