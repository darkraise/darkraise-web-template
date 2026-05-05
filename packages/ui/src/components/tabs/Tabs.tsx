"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils"
import "./tabs.css"

type TabsVariant = "default" | "outline" | "underline"

const TabsContext = React.createContext<{ variant: TabsVariant }>({
  variant: "default",
})

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  variant = "default",
  children,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: TabsVariant
}) {
  return (
    <TabsPrimitive.List
      ref={ref}
      data-variant={variant}
      className={cn("dr-tabs-list", className)}
      {...props}
    >
      <TabsContext.Provider value={{ variant }}>
        {children}
      </TabsContext.Provider>
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { variant } = React.useContext(TabsContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-variant={variant}
      className={cn("dr-tabs-trigger", className)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("dr-tabs-content", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
