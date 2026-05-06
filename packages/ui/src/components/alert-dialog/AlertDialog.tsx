import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "../../lib/utils"
import "../overlay-primitives/overlay-primitives.css"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

function AlertDialogOverlay({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn("dr-overlay-backdrop", className)}
      {...props}
      ref={ref}
    />
  )
}
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

function AlertDialogContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn("dr-alert-dialog-content", className)}
        {...props}
      />
    </AlertDialogPortal>
  )
}
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-overlay-header", className)} {...props} />
}
AlertDialogHeader.displayName = "AlertDialogHeader"

function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-overlay-footer", className)} {...props} />
}
AlertDialogFooter.displayName = "AlertDialogFooter"

function AlertDialogTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("dr-alert-dialog-title", className)}
      {...props}
    />
  )
}
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

function AlertDialogDescription({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("dr-overlay-description", className)}
      {...props}
    />
  )
}
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

function AlertDialogAction({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn("dr-btn", className)}
      data-variant="default"
      data-size="default"
      {...props}
    />
  )
}
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

function AlertDialogCancel({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn("dr-btn", "dr-alert-dialog-cancel", className)}
      data-variant="outline"
      data-size="default"
      {...props}
    />
  )
}
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

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
