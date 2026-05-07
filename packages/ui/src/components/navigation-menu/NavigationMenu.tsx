"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useControllableState, useEvent, useId } from "@primitives/state"
import "./navigation-menu.css"

interface NavigationMenuRootContextValue {
  value: string
  setValue: (next: string) => void
  /** Currently focus-visible (keyboard) item, for indicator. */
  triggerRefs: Map<string, HTMLElement | null>
  registerTriggerRef: (id: string, node: HTMLElement | null) => void
  /** Whether the menu is in a "viewport" rendering mode. */
  hasViewport: boolean
  setHasViewport: (next: boolean) => void
  /** Hover-intent timer used when switching menus. */
  hoverDelay: number
  closeDelay: number
  /** Schedule open/close with debounced timing. */
  scheduleOpen: (id: string) => void
  scheduleClose: () => void
  cancelSchedule: () => void
  rootId: string
}

const NavigationMenuRootContext =
  React.createContext<NavigationMenuRootContextValue | null>(null)

function useNavigationMenuRoot(
  consumer: string,
): NavigationMenuRootContextValue {
  const ctx = React.useContext(NavigationMenuRootContext)
  if (!ctx) throw new Error(`${consumer} must be used within <NavigationMenu>`)
  return ctx
}

interface NavigationMenuProps extends React.HTMLAttributes<HTMLElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  delayDuration?: number
  skipDelayDuration?: number
  dir?: "ltr" | "rtl"
  orientation?: "horizontal" | "vertical"
  ref?: React.Ref<HTMLElement>
}

function NavigationMenu({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  delayDuration = 200,
  skipDelayDuration = 300,
  ref,
  children,
  ...rest
}: NavigationMenuProps) {
  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  })

  // Stable Map identity owned by this component instance.
  const [triggerRefs] = React.useState(
    () => new Map<string, HTMLElement | null>(),
  )
  const [hasViewport, setHasViewport] = React.useState(false)
  const rootId = useId()

  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastInteractionRef = React.useRef<number>(0)

  const cancelSchedule = useEvent(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  })

  const scheduleOpen = useEvent((id: string) => {
    cancelSchedule()
    const now = Date.now()
    const elapsed = now - lastInteractionRef.current
    const delay = elapsed < skipDelayDuration ? 0 : delayDuration
    // Always defer through a timer (or microtask) so that a synchronous
    // click handler firing later in the same tick can override.
    openTimerRef.current = setTimeout(
      () => {
        setValue(id)
        lastInteractionRef.current = Date.now()
      },
      Math.max(delay, 0),
    )
  })

  const scheduleClose = useEvent(() => {
    cancelSchedule()
    closeTimerRef.current = setTimeout(() => {
      setValue("")
      lastInteractionRef.current = Date.now()
    }, 150)
  })

  const registerTriggerRef = React.useCallback(
    (id: string, node: HTMLElement | null) => {
      triggerRefs.set(id, node)
    },
    [triggerRefs],
  )

  React.useEffect(() => {
    return () => cancelSchedule()
  }, [cancelSchedule])

  const ctx = React.useMemo<NavigationMenuRootContextValue>(
    () => ({
      value,
      setValue,
      triggerRefs,
      registerTriggerRef,
      hasViewport,
      setHasViewport,
      hoverDelay: delayDuration,
      closeDelay: 150,
      scheduleOpen,
      scheduleClose,
      cancelSchedule,
      rootId,
    }),
    [
      value,
      setValue,
      triggerRefs,
      registerTriggerRef,
      hasViewport,
      delayDuration,
      scheduleOpen,
      scheduleClose,
      cancelSchedule,
      rootId,
    ],
  )

  return (
    <NavigationMenuRootContext.Provider value={ctx}>
      <nav
        ref={ref as React.Ref<HTMLElement>}
        className={cn("dr-navigation-menu", className)}
        aria-label="Main"
        data-orientation="horizontal"
        {...rest}
      >
        {children}
        <NavigationMenuViewport />
      </nav>
    </NavigationMenuRootContext.Provider>
  )
}

interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {
  ref?: React.Ref<HTMLUListElement>
}

function NavigationMenuList({
  className,
  ref,
  ...rest
}: NavigationMenuListProps) {
  return (
    <ul
      ref={ref}
      className={cn("dr-navigation-menu-list group", className)}
      data-orientation="horizontal"
      {...rest}
    />
  )
}

interface NavigationMenuItemContextValue {
  itemId: string
  triggerId: string
  contentId: string
}

const NavigationMenuItemContext =
  React.createContext<NavigationMenuItemContextValue | null>(null)

function useNavigationMenuItem(
  consumer: string,
): NavigationMenuItemContextValue {
  const ctx = React.useContext(NavigationMenuItemContext)
  if (!ctx)
    throw new Error(`${consumer} must be used within <NavigationMenuItem>`)
  return ctx
}

interface NavigationMenuItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  value?: string
  ref?: React.Ref<HTMLLIElement>
}

function NavigationMenuItem({
  className,
  value: valueProp,
  ref,
  children,
  ...rest
}: NavigationMenuItemProps) {
  const generatedId = useId()
  const itemId = valueProp ?? generatedId
  const triggerId = useId()
  const contentId = useId()

  const ctx = React.useMemo(
    () => ({ itemId, triggerId, contentId }),
    [itemId, triggerId, contentId],
  )

  return (
    <NavigationMenuItemContext.Provider value={ctx}>
      <li ref={ref} className={cn(className)} {...rest}>
        {children}
      </li>
    </NavigationMenuItemContext.Provider>
  )
}

const navigationMenuTriggerStyle = () => "dr-navigation-menu-trigger"

interface NavigationMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function NavigationMenuTrigger({
  className,
  asChild,
  type,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  ref,
  children,
  ...rest
}: NavigationMenuTriggerProps) {
  const root = useNavigationMenuRoot("NavigationMenuTrigger")
  const item = useNavigationMenuItem("NavigationMenuTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  const open = root.value === item.itemId

  const localRef = React.useRef<HTMLButtonElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      localRef.current = node
      root.registerTriggerRef(item.itemId, node)
    },
    [root, item.itemId],
  )

  return (
    <Comp
      ref={composeRefs(setRef as React.RefCallback<HTMLButtonElement>, ref)}
      type={resolvedType}
      id={item.triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? item.contentId : undefined}
      data-state={open ? "open" : "closed"}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        root.cancelSchedule()
        if (open) {
          root.setValue("")
        } else {
          root.setValue(item.itemId)
        }
      }}
      onPointerEnter={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        // Hover-to-open only when another menu is already open (fast switch).
        // First-open intent is committed by click/keyboard to avoid racing
        // with the click handler.
        if (root.value !== "" && root.value !== item.itemId) {
          root.scheduleOpen(item.itemId)
        }
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event)
        if (event.defaultPrevented) return
        root.scheduleClose()
      }}
      onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event)
        if (event.defaultPrevented) return
        if (event.currentTarget.matches(":focus-visible")) {
          root.cancelSchedule()
          root.setValue(item.itemId)
        }
      }}
      className={cn("dr-navigation-menu-trigger group", className)}
      {...rest}
    >
      {children}{" "}
      <ChevronDown
        className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </Comp>
  )
}

interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function NavigationMenuContent({
  className,
  forceMount,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: NavigationMenuContentProps) {
  const root = useNavigationMenuRoot("NavigationMenuContent")
  const item = useNavigationMenuItem("NavigationMenuContent")
  const open = root.value === item.itemId

  return (
    <Presence present={open} forceMount={forceMount}>
      <div
        ref={ref}
        id={item.contentId}
        data-state={open ? "open" : "closed"}
        aria-labelledby={item.triggerId}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          if (event.defaultPrevented) return
          root.cancelSchedule()
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          if (event.defaultPrevented) return
          root.scheduleClose()
        }}
        className={cn("dr-navigation-menu-content", className)}
        {...rest}
      />
    </Presence>
  )
}

interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean
  active?: boolean
  ref?: React.Ref<HTMLAnchorElement>
}

function NavigationMenuLink({
  className,
  asChild,
  active,
  ref,
  ...rest
}: NavigationMenuLinkProps) {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      data-active={active ? "" : undefined}
      className={cn(className)}
      {...rest}
    />
  )
}

interface NavigationMenuViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function NavigationMenuViewport({
  className,
  forceMount,
  ref,
  ...rest
}: NavigationMenuViewportProps) {
  const root = useNavigationMenuRoot("NavigationMenuViewport")
  const open = root.value !== ""
  const setHasViewport = root.setHasViewport
  React.useEffect(() => {
    setHasViewport(true)
    return () => setHasViewport(false)
  }, [setHasViewport])

  return (
    <div className="dr-navigation-menu-viewport-wrapper">
      <Presence present={open} forceMount={forceMount}>
        <div
          ref={ref}
          data-state={open ? "open" : "closed"}
          className={cn("dr-navigation-menu-viewport", className)}
          {...rest}
        />
      </Presence>
    </div>
  )
}

interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function NavigationMenuIndicator({
  className,
  ref,
  ...rest
}: NavigationMenuIndicatorProps) {
  const root = useNavigationMenuRoot("NavigationMenuIndicator")
  const visible = root.value !== ""

  const [position, setPosition] = React.useState<{
    left: number
    width: number
  } | null>(null)

  React.useEffect(() => {
    if (!visible) {
      setPosition(null)
      return
    }
    const node = root.triggerRefs.get(root.value)
    if (!node) return
    const rect = node.getBoundingClientRect()
    const parent = node.offsetParent as HTMLElement | null
    const parentRect = parent?.getBoundingClientRect()
    setPosition({
      left: parentRect ? rect.left - parentRect.left : rect.left,
      width: rect.width,
    })
  }, [root.value, root.triggerRefs, visible])

  return (
    <div
      ref={ref}
      data-state={visible ? "visible" : "hidden"}
      style={position ? { left: position.left, width: position.width } : {}}
      className={cn("dr-navigation-menu-indicator", className)}
      {...rest}
    >
      <div className="dr-navigation-menu-indicator-arrow" />
    </div>
  )
}

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
