"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { OverlayCloseButton } from "@components/overlay-primitives"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { useFocusTrap } from "@primitives/focus-trap"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useDialog, type UseDialogReturn } from "@components/dialog/useDialog"
import { lockScroll, unlockScroll } from "@components/dialog/scrollLock"
import "./drawer.css"

export type DrawerDirection = "top" | "right" | "bottom" | "left"

interface DrawerContextValue extends UseDialogReturn {
  direction: DrawerDirection
  /** lifted from content to handle: only the handle initiates close-by-drag */
  beginDrag: (event: React.PointerEvent) => void
  closeOnOutsidePointerDown: boolean
  closeOnEscape: boolean
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null)

function useDrawerContext(consumer: string): DrawerContextValue {
  const ctx = React.useContext(DrawerContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Drawer>`)
  return ctx
}

interface DrawerProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  direction?: DrawerDirection
  /** Close the drawer when the user clicks/taps the backdrop (anywhere
   *  outside the content). Defaults to `true`. */
  closeOnOutsidePointerDown?: boolean
  /** Close the drawer when the Escape key is pressed. Defaults to `true`. */
  closeOnEscape?: boolean
  /** vaul-compatible no-op slot, accepted for API parity. */
  shouldScaleBackground?: boolean
  children?: React.ReactNode
}

const DRAG_DISMISS_THRESHOLD = 80
const DRAG_VELOCITY_THRESHOLD = 0.3

function Drawer({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  direction = "bottom",
  closeOnOutsidePointerDown = true,
  closeOnEscape = true,
  children,
}: DrawerProps) {
  const dialog = useDialog({ open, defaultOpen, onOpenChange, modal })

  const dragRef = React.useRef<{
    pointerId: number
    startX: number
    startY: number
    startTime: number
  } | null>(null)

  const beginDrag = React.useCallback(
    (event: React.PointerEvent) => {
      // Bail if the pointerdown originated on (or inside) an interactive
      // child. The handle's `::before` pseudo-element expands the touch
      // target by 10px in every direction, so a tap near — but not on —
      // the close button can be caught here. Calling setPointerCapture on
      // the handle redirects the resulting click to the handle per the
      // pointer-capture spec, suppressing the button's click.
      if (
        event.target instanceof Element &&
        event.target !== event.currentTarget &&
        event.target.closest("button, a, [role='button']")
      ) {
        return
      }
      const root = (event.currentTarget as HTMLElement).closest(
        "[data-drawer-content]",
      ) as HTMLElement | null
      if (!root) return
      const startX = event.clientX
      const startY = event.clientY
      const startTime = performance.now()
      dragRef.current = {
        pointerId: event.pointerId,
        startX,
        startY,
        startTime,
      }
      try {
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      } catch {
        // ignore
      }

      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== dragRef.current?.pointerId) return
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let translate = ""
        switch (direction) {
          case "bottom":
            translate = `translateY(${Math.max(0, dy)}px)`
            break
          case "top":
            translate = `translateY(${Math.min(0, dy)}px)`
            break
          case "right":
            translate = `translateX(${Math.max(0, dx)}px)`
            break
          case "left":
            translate = `translateX(${Math.min(0, dx)}px)`
            break
        }
        root.style.transform = translate
        root.style.transition = "none"
      }

      const onUp = (e: PointerEvent) => {
        if (e.pointerId !== dragRef.current?.pointerId) return
        const drag = dragRef.current
        dragRef.current = null
        try {
          ;(event.currentTarget as HTMLElement).releasePointerCapture(
            e.pointerId,
          )
        } catch {
          // ignore
        }
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)

        const elapsed = performance.now() - drag.startTime
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const displacement =
          direction === "bottom"
            ? dy
            : direction === "top"
              ? -dy
              : direction === "right"
                ? dx
                : -dx
        const velocity = elapsed > 0 ? displacement / elapsed : 0
        const shouldClose =
          displacement > DRAG_DISMISS_THRESHOLD ||
          velocity > DRAG_VELOCITY_THRESHOLD
        root.style.transition = ""
        if (shouldClose) {
          // Keep the inline transform so the close animation's implicit
          // `from` picks up the dragged position. Wiping it first triggers a
          // visible snap-back to translateY(0) before the slide-out runs.
          dialog.setOpen(false)
        } else {
          root.style.transform = ""
        }
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [dialog, direction],
  )

  const ctx = React.useMemo<DrawerContextValue>(
    () => ({
      ...dialog,
      direction,
      beginDrag,
      closeOnOutsidePointerDown,
      closeOnEscape,
    }),
    [dialog, direction, beginDrag, closeOnOutsidePointerDown, closeOnEscape],
  )

  return <DrawerContext.Provider value={ctx}>{children}</DrawerContext.Provider>
}
Drawer.displayName = "Drawer"

interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function DrawerTrigger({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: DrawerTriggerProps) {
  const ctx = useDrawerContext("DrawerTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      id={ctx.triggerId}
      aria-haspopup="dialog"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.state}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(!ctx.open)
      }}
      {...props}
    />
  )
}

interface DrawerPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function DrawerPortal({ container, forceMount, children }: DrawerPortalProps) {
  void useDrawerContext("DrawerPortal")
  void forceMount
  return <Portal container={container}>{children}</Portal>
}

interface DrawerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function DrawerOverlay({
  className,
  forceMount,
  ref,
  ...props
}: DrawerOverlayProps) {
  const ctx = useDrawerContext("DrawerOverlay")
  return (
    <Presence present={ctx.open} forceMount={forceMount}>
      <div
        ref={ref}
        aria-hidden="true"
        className={cn("dr-drawer-overlay", className)}
        {...props}
      />
    </Presence>
  )
}

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  ref?: React.Ref<HTMLDivElement>
}

function DrawerContentImpl({
  className,
  children,
  onEscapeKeyDown,
  onPointerDownOutside,
  ref,
  ...rest
}: Omit<DrawerContentProps, "forceMount">) {
  const ctx = useDrawerContext("DrawerContent")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ctx.modal || !ctx.open) return
    const token = lockScroll()
    return () => unlockScroll(token)
  }, [ctx.modal, ctx.open])

  useFocusTrap(localRef, {
    disabled: !ctx.open,
    loop: true,
    restoreFocus: true,
  })

  return (
    <DismissableLayer
      onPointerDownOutside={(event) => {
        onPointerDownOutside?.(event)
        if (event.defaultPrevented) return
        if (!ctx.closeOnOutsidePointerDown) return
        ctx.setOpen(false)
      }}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event)
        if (event.defaultPrevented) return
        if (!ctx.closeOnEscape) return
        ctx.setOpen(false)
      }}
    >
      <div
        ref={composeRefs(localRef, ref)}
        role="dialog"
        id={ctx.contentId}
        aria-modal={ctx.modal ? "true" : undefined}
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.descriptionId}
        data-state={ctx.state}
        data-drawer-content
        data-direction={ctx.direction}
        tabIndex={-1}
        className={cn("dr-drawer-content", className)}
        {...rest}
      >
        <div
          className="dr-drawer-handle"
          aria-hidden="true"
          onPointerDown={ctx.beginDrag}
        />
        {children}
        <OverlayCloseButton onClick={() => ctx.setOpen(false)} />
      </div>
    </DismissableLayer>
  )
}

function DrawerContent({ forceMount, ...props }: DrawerContentProps) {
  const ctx = useDrawerContext("DrawerContent")
  return (
    <DrawerPortal forceMount={forceMount}>
      <DrawerOverlay forceMount={forceMount} />
      <Presence present={ctx.open} forceMount={forceMount}>
        <DrawerContentImpl {...props} />
      </Presence>
    </DrawerPortal>
  )
}

interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function DrawerClose({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: DrawerCloseProps) {
  const ctx = useDrawerContext("DrawerClose")
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

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-drawer-header", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-drawer-footer", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>
}

function DrawerTitle({ className, ref, id, ...props }: DrawerTitleProps) {
  const ctx = useDrawerContext("DrawerTitle")
  return (
    <h2
      ref={ref}
      id={id ?? ctx.titleId}
      className={cn("dr-drawer-title", className)}
      {...props}
    />
  )
}

interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>
}

function DrawerDescription({
  className,
  ref,
  id,
  ...props
}: DrawerDescriptionProps) {
  const ctx = useDrawerContext("DrawerDescription")
  return (
    <p
      ref={ref}
      id={id ?? ctx.descriptionId}
      className={cn("dr-drawer-description", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
