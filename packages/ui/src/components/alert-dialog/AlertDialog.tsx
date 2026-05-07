"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@components/dialog"
import "@components/overlay-primitives/overlay-primitives.css"

interface AlertDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

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

const AlertDialogTrigger = DialogTrigger
const AlertDialogPortal = DialogPortal
const AlertDialogOverlay = DialogOverlay

type AlertDialogContentProps = React.ComponentProps<typeof DialogContent>

function AlertDialogContent({
  className,
  children,
  ref,
  ...props
}: AlertDialogContentProps) {
  return (
    <DialogContent
      ref={ref}
      className={cn("dr-alert-dialog-content", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

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

type AlertDialogTitleProps = React.ComponentProps<typeof DialogTitle>

function AlertDialogTitle({ className, ref, ...props }: AlertDialogTitleProps) {
  return (
    <DialogTitle
      ref={ref}
      className={cn("dr-alert-dialog-title", className)}
      {...props}
    />
  )
}

type AlertDialogDescriptionProps = React.ComponentProps<
  typeof DialogDescription
>

function AlertDialogDescription({
  className,
  ref,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <DialogDescription
      ref={ref}
      className={cn("dr-overlay-description", className)}
      {...props}
    />
  )
}

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
