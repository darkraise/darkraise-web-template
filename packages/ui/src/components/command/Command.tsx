"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@components/dialog"
import "./command.css"

function Command({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn("dr-command", className)}
      {...props}
    />
  )
}

interface CommandDialogProps extends DialogProps {
  title?: string
  description?: string
}

const CommandDialog = ({
  children,
  title = "Command Menu",
  description = "Search for a command to run.",
  ...props
}: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command className="dr-command-dialog">{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="dr-command-input-wrapper" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn("dr-command-input", className)}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn("dr-command-list", className)}
      {...props}
    />
  )
}

function CommandEmpty({
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty ref={ref} className="dr-command-empty" {...props} />
  )
}

function CommandGroup({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn("dr-command-group", className)}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("dr-command-separator", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn("dr-command-item", className)}
      {...props}
    />
  )
}

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("dr-command-shortcut", className)} {...props} />
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
