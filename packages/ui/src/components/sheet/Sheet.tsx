import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"

import { cn } from "@lib/utils"
import { OverlayCloseButton } from "@components/overlay-primitives"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

function SheetOverlay({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn("dr-overlay-backdrop", className)}
      {...props}
      ref={ref}
    />
  )
}

type SheetSide = "top" | "right" | "bottom" | "left"

interface SheetContentProps extends React.ComponentProps<
  typeof SheetPrimitive.Content
> {
  side?: SheetSide
}

function SheetContent({
  side = "right",
  className,
  children,
  ref,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn("dr-sheet-content", className)}
        data-side={side}
        {...props}
      >
        {children}
        <OverlayCloseButton />
      </SheetPrimitive.Content>
    </SheetPortal>
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

function SheetTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      ref={ref}
      className={cn("text-foreground text-lg font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
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
