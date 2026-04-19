"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

const tabsListVariants = cva("inline-flex items-center text-muted-foreground", {
  variants: {
    variant: {
      default: "card-surface bg-muted h-10 justify-center p-1",
      outline: "h-10 gap-2",
      underline: "h-10 gap-4 border-b border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const tabsTriggerVariants = cva(
  "ring-offset-background focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-sm px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
        outline:
          "rounded-md border border-input bg-transparent px-3 py-1.5 hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary data-[state=active]:hover:bg-primary/10 data-[state=active]:hover:text-primary",
        underline:
          "-mb-px h-full border-b-2 border-transparent px-3 py-1.5 data-[state=active]:border-primary data-[state=active]:text-primary",
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
        "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
