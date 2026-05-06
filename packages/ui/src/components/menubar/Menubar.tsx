import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@lib/utils"
import "./menubar.css"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function Menubar({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      ref={ref}
      className={cn("dr-menubar", className)}
      {...props}
    />
  )
}
Menubar.displayName = MenubarPrimitive.Root.displayName

function MenubarTrigger({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      className={cn("dr-menubar-trigger", className)}
      {...props}
    />
  )
}
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

function MenubarSubTrigger({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      className={cn("dr-menubar-sub-trigger", inset && "pl-8", className)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  )
}
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

function MenubarSubContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      ref={ref}
      className={cn("dr-menubar-sub-content", className)}
      {...props}
    />
  )
}
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn("dr-menubar-content", className)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
}
MenubarContent.displayName = MenubarPrimitive.Content.displayName

function MenubarItem({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Item
      ref={ref}
      className={cn("dr-menubar-item", inset && "pl-8", className)}
      {...props}
    />
  )
}
MenubarItem.displayName = MenubarPrimitive.Item.displayName

function MenubarCheckboxItem({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      ref={ref}
      className={cn("dr-menubar-checkbox-item", className)}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

function MenubarRadioItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      ref={ref}
      className={cn("dr-menubar-radio-item", className)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

function MenubarLabel({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      ref={ref}
      className={cn("dr-menubar-label", inset && "pl-8", className)}
      {...props}
    />
  )
}
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

function MenubarSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      ref={ref}
      className={cn("dr-menubar-separator", className)}
      {...props}
    />
  )
}
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

function MenubarShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("dr-menubar-shortcut", className)} {...props} />
}
MenubarShortcut.displayName = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
