"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const tabsListVariants = cva("inline-flex items-center text-muted-foreground", {
  variants: {
    variant: {
      default: "card-surface bg-muted justify-center p-1",
      outline: "card-surface bg-muted justify-center p-1 gap-1",
      underline: "gap-4 border-b border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const tabsTriggerVariants = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-sm px-2.5 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
        outline:
          "rounded-sm border border-transparent bg-transparent px-2.5 py-1.5 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:shadow-sm",
        underline:
          "-mb-px h-full border-b-2 border-transparent px-2.5 py-1.5 data-[state=active]:border-primary data-[state=active]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type TabsListVariant = NonNullable<
  VariantProps<typeof tabsListVariants>["variant"]
>

const TabsContext = React.createContext<{ variant: TabsListVariant }>({
  variant: "default",
})

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  variant,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const resolvedVariant: TabsListVariant = variant ?? "default"
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      <TabsContext.Provider value={{ variant: resolvedVariant }}>
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
      className={cn(tabsTriggerVariants({ variant }), className)}
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
      className={cn(
        "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
