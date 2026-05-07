"use client"

import * as React from "react"

import { useId } from "@primitives/state"
import { Presence } from "@primitives/presence"
import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import "./tabs.css"

import {
  useTabs,
  type TabsContextValue,
  type TabsOrientation,
  type TabsActivationMode,
} from "./useTabs"

type TabsVariant = "default" | "outline" | "underline"

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext(consumer: string): TabsContextValue {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Tabs>`)
  return ctx
}

const TabsListVariantContext = React.createContext<{ variant: TabsVariant }>({
  variant: "default",
})

interface TabsContentIdContextValue {
  triggerId: (value: string) => string
  contentId: (value: string) => string
}
const TabsIdContext = React.createContext<TabsContentIdContextValue | null>(
  null,
)

function useTabsIdContext(): TabsContentIdContextValue {
  const ctx = React.useContext(TabsIdContext)
  if (!ctx) throw new Error("Tabs id context missing")
  return ctx
}

interface TabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "dir"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: TabsOrientation
  activationMode?: TabsActivationMode
  dir?: "ltr" | "rtl"
  ref?: React.Ref<HTMLDivElement>
}

function Tabs({
  ref,
  value,
  defaultValue,
  onValueChange,
  orientation,
  activationMode,
  dir,
  children,
  ...props
}: TabsProps) {
  const ctx = useTabs({
    value,
    defaultValue,
    onValueChange,
    orientation,
    activationMode,
    dir,
  })

  const baseId = useId()
  const idCtx = React.useMemo<TabsContentIdContextValue>(
    () => ({
      triggerId: (v: string) => `${baseId}-trigger-${v}`,
      contentId: (v: string) => `${baseId}-content-${v}`,
    }),
    [baseId],
  )

  return (
    <div ref={ref} data-orientation={ctx.orientation} dir={ctx.dir} {...props}>
      <TabsContext.Provider value={ctx}>
        <TabsIdContext.Provider value={idCtx}>
          {children}
        </TabsIdContext.Provider>
      </TabsContext.Provider>
    </div>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TabsVariant
  loop?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function TabsList({
  className,
  variant = "default",
  children,
  ref,
  loop: _loop,
  ...props
}: TabsListProps) {
  const ctx = useTabsContext("TabsList")
  void _loop
  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={ctx.orientation}
      data-orientation={ctx.orientation}
      data-variant={variant}
      className={cn("dr-tabs-list", className)}
      {...props}
    >
      <TabsListVariantContext.Provider value={{ variant }}>
        {children}
      </TabsListVariantContext.Provider>
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  ref?: React.Ref<HTMLButtonElement>
}

function TabsTrigger({
  className,
  ref,
  value,
  disabled,
  onClick,
  onKeyDown,
  onFocus,
  children,
  ...props
}: TabsTriggerProps) {
  const ctx = useTabsContext("TabsTrigger")
  const ids = useTabsIdContext()
  const { variant } = React.useContext(TabsListVariantContext)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)

  const isSelected = ctx.value === value
  const isDisabled = disabled === true

  const register = ctx.registerTrigger
  React.useEffect(() => {
    return register(value, buttonRef.current, isDisabled)
  }, [register, value, isDisabled])

  return (
    <button
      ref={composedRef}
      type="button"
      role="tab"
      id={ids.triggerId(value)}
      aria-controls={ids.contentId(value)}
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      data-disabled={isDisabled ? "" : undefined}
      data-orientation={ctx.orientation}
      data-variant={variant}
      disabled={isDisabled}
      tabIndex={isSelected ? 0 : -1}
      className={cn("dr-tabs-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (isDisabled) return
        ctx.setValue(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.handleTriggerKeyDown(event, value)
      }}
      onFocus={onFocus}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function TabsContent({
  className,
  ref,
  value,
  forceMount,
  children,
  ...props
}: TabsContentProps) {
  const ctx = useTabsContext("TabsContent")
  const ids = useTabsIdContext()
  const isSelected = ctx.value === value

  const node = (
    <div
      ref={ref}
      role="tabpanel"
      id={ids.contentId(value)}
      aria-labelledby={ids.triggerId(value)}
      data-state={isSelected ? "active" : "inactive"}
      data-orientation={ctx.orientation}
      hidden={!isSelected}
      tabIndex={0}
      className={cn("dr-tabs-content", className)}
      {...props}
    >
      {children}
    </div>
  )

  return (
    <Presence present={isSelected} forceMount={forceMount}>
      {node}
    </Presence>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
