"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@components/dialog"

const Sheet = Dialog
const SheetTrigger = DialogTrigger
const SheetClose = DialogClose
const SheetPortal = DialogPortal

type SheetOverlayProps = React.ComponentProps<typeof DialogOverlay>

function SheetOverlay({ className, ref, ...props }: SheetOverlayProps) {
  return (
    <DialogOverlay
      ref={ref}
      className={cn("dr-overlay-backdrop", className)}
      {...props}
    />
  )
}

type SheetSide = "top" | "right" | "bottom" | "left"

interface SheetContentProps extends Omit<
  React.ComponentProps<typeof DialogContent>,
  "children"
> {
  side?: SheetSide
  children?: React.ReactNode
}

function SheetContent({
  side = "right",
  className,
  children,
  ref,
  ...props
}: SheetContentProps) {
  return (
    <DialogContent
      ref={ref}
      className={cn("dr-sheet-content", className)}
      data-side={side}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-overlay-header", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("dr-overlay-footer", className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

type SheetTitleProps = React.ComponentProps<typeof DialogTitle>

function SheetTitle({ className, ref, ...props }: SheetTitleProps) {
  return (
    <DialogTitle
      ref={ref}
      className={cn("text-foreground text-lg font-semibold", className)}
      {...props}
    />
  )
}

type SheetDescriptionProps = React.ComponentProps<typeof DialogDescription>

function SheetDescription({ className, ref, ...props }: SheetDescriptionProps) {
  return (
    <DialogDescription
      ref={ref}
      className={cn("dr-overlay-description", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
