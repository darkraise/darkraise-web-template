"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { OverlayCloseButton } from "@components/overlay-primitives"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { useFocusTrap } from "@primitives/focus-trap"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useDialog, type DialogRole, type UseDialogReturn } from "./useDialog"
import { lockScroll, unlockScroll } from "./scrollLock"

interface DialogContextValue extends UseDialogReturn {
  closeOnOutsidePointerDown: boolean
  closeOnEscape: boolean
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext(consumer: string): DialogContextValue {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Dialog>`)
  return ctx
}

interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  /** internal: AlertDialog passes "alertdialog" */
  role?: DialogRole
  /** internal: AlertDialog disables outside-pointer-down close */
  closeOnOutsidePointerDown?: boolean
  /** internal: customizable Escape close */
  closeOnEscape?: boolean
  children?: React.ReactNode
}

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  role = "dialog",
  closeOnOutsidePointerDown = true,
  closeOnEscape = true,
  children,
}: DialogProps) {
  const dialog = useDialog({ open, defaultOpen, onOpenChange, modal, role })

  const ctx = React.useMemo<DialogContextValue>(
    () => ({
      ...dialog,
      closeOnOutsidePointerDown,
      closeOnEscape,
    }),
    [dialog, closeOnOutsidePointerDown, closeOnEscape],
  )

  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function DialogTrigger({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: DialogTriggerProps) {
  const ctx = useDialogContext("DialogTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      id={ctx.triggerId}
      aria-haspopup={ctx.role === "alertdialog" ? "dialog" : ctx.role}
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

interface DialogPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function DialogPortal({ container, forceMount, children }: DialogPortalProps) {
  const ctx = useDialogContext("DialogPortal")
  if (!forceMount && !ctx.open) return null
  return <Portal container={container}>{children}</Portal>
}

interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function DialogOverlay({
  className,
  forceMount,
  ref,
  ...props
}: DialogOverlayProps) {
  const ctx = useDialogContext("DialogOverlay")
  return (
    <Presence present={ctx.open} forceMount={forceMount}>
      <div
        ref={ref}
        aria-hidden="true"
        className={cn("dr-overlay-backdrop", className)}
        {...props}
      />
    </Presence>
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
  ref?: React.Ref<HTMLDivElement>
}

function DialogContentImpl({
  className,
  children,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...rest
}: Omit<DialogContentProps, "forceMount">) {
  const ctx = useDialogContext("DialogContent")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ctx.modal || !ctx.open) return
    lockScroll()
    return () => unlockScroll()
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
        onInteractOutside?.(event)
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
      onFocusOutside={(event) => {
        onInteractOutside?.(event)
      }}
    >
      <div
        ref={composeRefs(localRef, ref)}
        role={ctx.role}
        id={ctx.contentId}
        aria-modal={ctx.modal ? "true" : undefined}
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.descriptionId}
        data-state={ctx.state}
        tabIndex={-1}
        className={cn(
          ctx.role === "alertdialog"
            ? "dr-alert-dialog-content"
            : "dr-dialog-content",
          className,
        )}
        {...rest}
      >
        {children}
        {ctx.role === "dialog" ? <OverlayCloseButton /> : null}
      </div>
    </DismissableLayer>
  )
}

function DialogContent({ forceMount, ...props }: DialogContentProps) {
  const ctx = useDialogContext("DialogContent")
  return (
    <DialogPortal forceMount={forceMount}>
      <DialogOverlay forceMount={forceMount} />
      <Presence present={ctx.open} forceMount={forceMount}>
        <DialogContentImpl {...props} />
      </Presence>
    </DialogPortal>
  )
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function DialogClose({
  ref,
  asChild,
  type,
  onClick,
  ...props
}: DialogCloseProps) {
  const ctx = useDialogContext("DialogClose")
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

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-overlay-header", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-overlay-footer", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>
}

function DialogTitle({ className, ref, id, ...props }: DialogTitleProps) {
  const ctx = useDialogContext("DialogTitle")
  return (
    <h2
      ref={ref}
      id={id ?? ctx.titleId}
      className={cn("dr-dialog-title", className)}
      {...props}
    />
  )
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>
}

function DialogDescription({
  className,
  ref,
  id,
  ...props
}: DialogDescriptionProps) {
  const ctx = useDialogContext("DialogDescription")
  return (
    <p
      ref={ref}
      id={id ?? ctx.descriptionId}
      className={cn("dr-overlay-description", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
