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

type TabsVariant = "default" | "outline" | "underline" | "enclosed"
type TabsColor = "default" | "accent"

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext(consumer: string): TabsContextValue {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Tabs>`)
  return ctx
}

const TabsStyleContext = React.createContext<{
  variant: TabsVariant
  color: TabsColor
}>({
  variant: "default",
  color: "default",
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
  "defaultValue" | "onChange" | "dir" | "color"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: TabsOrientation
  variant?: TabsVariant
  color?: TabsColor
  activationMode?: TabsActivationMode
  dir?: "ltr" | "rtl"
  ref?: React.Ref<HTMLDivElement>
}

function Tabs({
  ref,
  className,
  value,
  defaultValue,
  onValueChange,
  orientation,
  variant = "default",
  color = "default",
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

  const styleCtx = React.useMemo(() => ({ variant, color }), [variant, color])

  return (
    <div
      ref={ref}
      data-orientation={ctx.orientation}
      data-variant={variant}
      data-color={color}
      dir={ctx.dir}
      className={cn("dr-tabs", className)}
      {...props}
    >
      <TabsContext.Provider value={ctx}>
        <TabsIdContext.Provider value={idCtx}>
          <TabsStyleContext.Provider value={styleCtx}>
            {children}
          </TabsStyleContext.Provider>
        </TabsIdContext.Provider>
      </TabsContext.Provider>
    </div>
  )
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean
  ref?: React.Ref<HTMLDivElement>
}

// The underline indicator is a bar pinned to the strip's edge rather than
// a box behind the label, so it takes a fixed thickness instead of the
// active trigger's measured cross-axis size.
const UNDERLINE_THICKNESS = 2

interface IndicatorRect {
  left: number
  top: number
  width: number
  height: number
}

function TabsList({
  className,
  children,
  ref,
  loop: _loop,
  ...props
}: TabsListProps) {
  const ctx = useTabsContext("TabsList")
  const { variant, color } = React.useContext(TabsStyleContext)
  const listRef = React.useRef<HTMLDivElement>(null)
  const composedRef = composeRefs(ref, listRef)
  const [rect, setRect] = React.useState<IndicatorRect | null>(null)
  const [mounted, setMounted] = React.useState(false)
  void _loop

  const measure = React.useCallback(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector<HTMLElement>(
      '[role="tab"][data-state="active"]',
    )
    if (!active) {
      setRect(null)
      return
    }
    setRect({
      left: active.offsetLeft,
      top: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
    })
  }, [])

  React.useLayoutEffect(() => {
    measure()
  }, [measure, ctx.value, ctx.orientation, variant])

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(list)
    for (const tab of list.querySelectorAll('[role="tab"]')) {
      observer.observe(tab)
    }
    return () => {
      observer.disconnect()
    }
  }, [measure])

  // Enable transitions only after the first measured paint has committed,
  // so the indicator does not slide in from the strip's origin on mount.
  React.useEffect(() => {
    if (mounted || !rect) return
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [mounted, rect])

  return (
    <div
      ref={composedRef}
      role="tablist"
      aria-orientation={ctx.orientation}
      data-orientation={ctx.orientation}
      data-variant={variant}
      data-color={color}
      data-mounted={mounted ? "true" : "false"}
      className={cn("dr-tabs-list", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        data-orientation={ctx.orientation}
        data-variant={variant}
        data-color={color}
        data-active={rect ? "true" : "false"}
        className="dr-tabs-indicator"
        style={indicatorStyle(rect, ctx.orientation, variant)}
      />
      {children}
    </div>
  )
}

// Both axes are expressed against the strip's padding box, which is the
// frame `offsetLeft`/`offsetTop` already use. That works only because the
// CSS pins the indicator at `left: 0; top: 0` — an absolutely positioned
// flex child otherwise starts at its *static position*, and these strips
// are `justify-center`, so the travel would begin from the centre of the
// strip rather than its leading edge.
function indicatorStyle(
  rect: IndicatorRect | null,
  orientation: TabsOrientation,
  variant: TabsVariant,
): React.CSSProperties {
  if (!rect) return { opacity: 0, pointerEvents: "none" }

  const vertical = orientation === "vertical"
  const thickness = variant === "underline" ? UNDERLINE_THICKNESS : null

  // The travel uses the `translate` property rather than `transform`. In
  // the transform chain (translate, rotate, scale, transform) translate is
  // applied outermost, so a preset that pops the indicator with `scale`
  // cannot multiply the distance travelled. Expressed as
  // `transform: translateX(...)` instead, Playful's scale: 1.04 stretched
  // every offset by 4% and pushed the pill off its tab.
  if (vertical) {
    return {
      translate: `0 ${rect.top}px`,
      height: `${rect.height}px`,
      left: `${thickness === null ? rect.left : rect.left + rect.width - thickness}px`,
      width: `${thickness ?? rect.width}px`,
    }
  }

  return {
    translate: `${rect.left}px 0`,
    width: `${rect.width}px`,
    top: `${thickness === null ? rect.top : rect.top + rect.height - thickness}px`,
    height: `${thickness ?? rect.height}px`,
  }
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
  const { variant, color } = React.useContext(TabsStyleContext)
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
      data-color={color}
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
  const { variant, color } = React.useContext(TabsStyleContext)
  const isSelected = ctx.value === value

  const node = (
    <div
      ref={ref}
      role="tabpanel"
      id={ids.contentId(value)}
      aria-labelledby={ids.triggerId(value)}
      data-state={isSelected ? "active" : "inactive"}
      data-orientation={ctx.orientation}
      data-variant={variant}
      data-color={color}
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
