import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils"
import "./drawer.css"

function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  )
}
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

function DrawerOverlay({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn("dr-drawer-overlay", className)}
      {...props}
    />
  )
}
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

function DrawerContent({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn("dr-drawer-content", className)}
        {...props}
      >
        <div className="dr-drawer-handle" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}
DrawerContent.displayName = "DrawerContent"

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-drawer-header", className)} {...props} />
}
DrawerHeader.displayName = "DrawerHeader"

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-drawer-footer", className)} {...props} />
}
DrawerFooter.displayName = "DrawerFooter"

function DrawerTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      ref={ref}
      className={cn("dr-drawer-title", className)}
      {...props}
    />
  )
}
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

function DrawerDescription({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      ref={ref}
      className={cn("dr-drawer-description", className)}
      {...props}
    />
  )
}
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

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
