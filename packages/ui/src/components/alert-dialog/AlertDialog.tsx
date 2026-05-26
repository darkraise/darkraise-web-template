"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@components/dialog"

interface AlertDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * AlertDialog is a thin behavior/a11y variant of Dialog:
 *   - forces `role="alertdialog"` (consumers + screen readers see the
 *     alertdialog semantics)
 *   - disables outside-pointer-down close (a11y pattern: alert dialogs
 *     must be dismissed by an explicit action/cancel button, never by
 *     clicking away)
 *
 * Every visual + structural concern (content surface, title, header,
 * footer, description, portal, overlay, close-button behavior) reuses
 * Dialog directly. Style changes to Dialog flow into AlertDialog
 * automatically.
 */
function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AlertDialogProps) {
  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      role="alertdialog"
      closeOnOutsidePointerDown={false}
    >
      {children}
    </Dialog>
  )
}

// Pure aliases — these render identically to their Dialog counterparts.
// The `role="alertdialog"` on the content element (set by AlertDialog
// root via the Dialog context) is what differentiates an alert dialog
// from a regular dialog at the DOM + a11y level. No CSS divergence.
const AlertDialogTrigger = DialogTrigger
const AlertDialogPortal = DialogPortal
const AlertDialogOverlay = DialogOverlay
const AlertDialogContent = DialogContent
const AlertDialogHeader = DialogHeader
const AlertDialogFooter = DialogFooter
const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function AlertDialogAction({
  className,
  ref,
  type,
  ...props
}: AlertDialogActionProps) {
  return (
    <DialogClose
      ref={ref}
      type={type ?? "button"}
      className={cn("dr-btn", className)}
      data-variant="default"
      data-size="default"
      {...props}
    />
  )
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function AlertDialogCancel({
  className,
  ref,
  type,
  ...props
}: AlertDialogCancelProps) {
  return (
    <DialogClose
      ref={ref}
      type={type ?? "button"}
      className={cn("dr-btn", "dr-alert-dialog-cancel", className)}
      data-variant="outline"
      data-size="default"
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
