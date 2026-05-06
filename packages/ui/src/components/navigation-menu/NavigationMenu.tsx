import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import "./navigation-menu.css"

function NavigationMenu({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      ref={ref}
      className={cn("dr-navigation-menu", className)}
      {...props}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  )
}
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

function NavigationMenuList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      ref={ref}
      className={cn("dr-navigation-menu-list group", className)}
      {...props}
    />
  )
}
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = () => "dr-navigation-menu-trigger"

function NavigationMenuTrigger({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn("dr-navigation-menu-trigger group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDown
        className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

function NavigationMenuContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn("dr-navigation-menu-content", className)}
      {...props}
    />
  )
}
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

function NavigationMenuViewport({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="dr-navigation-menu-viewport-wrapper">
      <NavigationMenuPrimitive.Viewport
        className={cn("dr-navigation-menu-viewport", className)}
        ref={ref}
        {...props}
      />
    </div>
  )
}
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

function NavigationMenuIndicator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      ref={ref}
      className={cn("dr-navigation-menu-indicator", className)}
      {...props}
    >
      <div className="dr-navigation-menu-indicator-arrow" />
    </NavigationMenuPrimitive.Indicator>
  )
}
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
