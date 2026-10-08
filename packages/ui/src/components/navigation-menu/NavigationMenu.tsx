import { useUiText } from "../../i18n/useUiText"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import { getDirection, inlineArrow } from "@lib/direction"
import type { SurfaceFill } from "@lib/surface-fill"
import { placementOf, resolveSide, useFloating } from "@primitives/floating"
import { Presence } from "@primitives/presence"
import { Slot, useComposedRefs } from "@primitives/slot"
import { useControllableState, useEvent, useId } from "@primitives/state"
import "./navigation-menu.css"

interface NavigationMenuRootContextValue {
  value: string
  setValue: (next: string) => void
  /** Currently focus-visible (keyboard) item, for indicator. */
  triggerRefs: Map<string, HTMLElement | null>
  registerTriggerRef: (id: string, node: HTMLElement | null) => void
  closeDelay: number
  /** Close after `closeDelay`, unless cancelled first. */
  scheduleClose: () => void
  cancelSchedule: () => void
  /** Marks an item whose content takes focus once it mounts (ArrowDown on
   *  its trigger opens it and moves focus into it). */
  requestContentFocus: (id: string) => void
  /** True once for an item marked by `requestContentFocus`. */
  takeContentFocus: (id: string) => boolean
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
  dir?: "ltr" | "rtl"
  ref?: React.Ref<HTMLElement>
}

function NavigationMenu({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  ref,
  children,
  ...rest
}: NavigationMenuProps) {
  const uiText = useUiText()

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  })

  // Stable Map identity owned by this component instance.
  const [triggerRefs] = React.useState(
    () => new Map<string, HTMLElement | null>(),
  )
  const rootId = useId()

  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFocusRef = React.useRef<string | null>(null)

  const cancelSchedule = useEvent(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  })

  const scheduleClose = useEvent(() => {
    cancelSchedule()
    closeTimerRef.current = setTimeout(() => setValue(""), 150)
  })

  const requestContentFocus = useEvent((id: string) => {
    pendingFocusRef.current = id
  })

  const takeContentFocus = useEvent((id: string) => {
    if (pendingFocusRef.current !== id) return false
    pendingFocusRef.current = null
    return true
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
      closeDelay: 150,
      scheduleClose,
      cancelSchedule,
      requestContentFocus,
      takeContentFocus,
      rootId,
    }),
    [
      value,
      setValue,
      triggerRefs,
      registerTriggerRef,
      scheduleClose,
      cancelSchedule,
      requestContentFocus,
      takeContentFocus,
      rootId,
    ],
  )

  return (
    <NavigationMenuRootContext.Provider value={ctx}>
      <nav
        ref={ref as React.Ref<HTMLElement>}
        className={cn("dr-navigation-menu", className)}
        aria-label={uiText("Main")}
        data-orientation="horizontal"
        {...rest}
      >
        {children}
      </nav>
    </NavigationMenuRootContext.Provider>
  )
}

interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {
  ref?: React.Ref<HTMLUListElement>
}

/** Each top-level item's trigger or link, in DOM order. */
function topLevelItems(list: HTMLElement): HTMLElement[] {
  return Array.from(
    list.querySelectorAll<HTMLElement>(
      ":scope > li > button:not(:disabled), :scope > li > a[href]",
    ),
  )
}

/** The links and enabled buttons inside a content panel, in DOM order. */
function contentItems(content: HTMLElement): HTMLElement[] {
  return Array.from(
    content.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)"),
  )
}

function NavigationMenuList({
  className,
  ref,
  onKeyDown,
  ...rest
}: NavigationMenuListProps) {
  return (
    <ul
      ref={ref}
      className={cn("dr-navigation-menu-list group", className)}
      data-orientation="horizontal"
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const items = topLevelItems(event.currentTarget)
        const index = items.indexOf(event.target as HTMLElement)
        if (index < 0) return
        const step = inlineArrow(event.key, event.currentTarget)
        let next: HTMLElement | undefined
        if (step === "next") {
          next = items[index + 1]
        } else if (step === "prev") {
          next = items[index - 1]
        } else if (event.key === "Home") {
          next = items[0]
        } else if (event.key === "End") {
          next = items[items.length - 1]
        } else {
          return
        }
        event.preventDefault()
        next?.focus()
      }}
      {...rest}
    />
  )
}

interface NavigationMenuItemContextValue {
  itemId: string
  triggerId: string
  contentId: string
  /** The trigger element, as state so the panel can anchor to it. */
  trigger: HTMLElement | null
  setTrigger: (node: HTMLElement | null) => void
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
  const [trigger, setTrigger] = React.useState<HTMLElement | null>(null)

  const ctx = React.useMemo(
    () => ({ itemId, triggerId, contentId, trigger, setTrigger }),
    [itemId, triggerId, contentId, trigger],
  )

  return (
    <NavigationMenuItemContext.Provider value={ctx}>
      <li ref={ref} className={cn("relative", className)} {...rest}>
        {children}
      </li>
    </NavigationMenuItemContext.Provider>
  )
}

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
  onKeyDown,
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
  const registerTriggerRef = root.registerTriggerRef
  const setTrigger = item.setTrigger
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      localRef.current = node
      registerTriggerRef(item.itemId, node)
      setTrigger(node)
    },
    [registerTriggerRef, setTrigger, item.itemId],
  )

  const composedRef = useComposedRefs(
    setRef as React.RefCallback<HTMLButtonElement>,
    ref,
  )

  return (
    <Comp
      ref={composedRef}
      type={resolvedType}
      id={item.triggerId}
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
        // Cancel any pending close. Hover-to-open is intentionally NOT
        // implemented here — Radix's nav-menu opens on click for a11y, and
        // doing it here would race with click in tests and on real touch
        // devices. Fast-switching between open menus is handled in the
        // click handler.
        root.cancelSchedule()
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event)
        if (event.defaultPrevented) return
        // Trigger leave does not auto-close. Content owns the close behaviour
        // so the user can move from trigger to its content without flicker.
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "ArrowDown") {
          event.preventDefault()
          root.cancelSchedule()
          const content = open ? document.getElementById(item.contentId) : null
          if (content) {
            contentItems(content)[0]?.focus()
          } else {
            root.requestContentFocus(item.itemId)
            root.setValue(item.itemId)
          }
        } else if (event.key === "Escape" && open) {
          event.preventDefault()
          root.setValue("")
        }
      }}
      className={cn("dr-navigation-menu-trigger group", className)}
      {...rest}
    >
      {children}{" "}
      <ChevronDown
        className="relative top-[1px] ms-1 size-[var(--icon-size-xs)] transition-transform duration-(--duration-normal) group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </Comp>
  )
}

interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
  ref?: React.Ref<HTMLDivElement>
  /** Which plane the surface paints; nested non-portalled surfaces inherit it. */
  surface?: SurfaceFill
}

function NavigationMenuContent({
  className,
  forceMount,
  ref,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  onBlur,
  surface,
  style,
  ...rest
}: NavigationMenuContentProps) {
  const root = useNavigationMenuRoot("NavigationMenuContent")
  const item = useNavigationMenuItem("NavigationMenuContent")
  const open = root.value === item.itemId

  // The panel stays inside its item in the DOM and is placed with fixed
  // coordinates, so no ancestor overflow clips it and it stays on screen.
  const floating = useFloating({
    strategy: "fixed",
    placement: placementOf(resolveSide("bottom", item.trigger), "start"),
    sideOffset: 6,
  })
  const setReferenceFloat = floating.refs.setReference
  React.useLayoutEffect(() => {
    setReferenceFloat(item.trigger)
  }, [item.trigger, setReferenceFloat])

  const takeContentFocus = root.takeContentFocus
  // A ref callback, not an effect: Presence mounts the panel a render after
  // `open` turns true, so an effect keyed on `open` runs before it exists.
  const focusOnMount = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node && takeContentFocus(item.itemId)) contentItems(node)[0]?.focus()
    },
    [takeContentFocus, item.itemId],
  )
  // A force-mounted panel is already in the DOM when `open` turns true, so
  // its ref callback does not run again.
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    if (open) focusOnMount(panelRef.current)
  }, [open, focusOnMount])

  const composedRef = useComposedRefs(
    focusOnMount,
    panelRef,
    floating.refs.setFloating,
    ref,
  )

  return (
    <Presence present={open} forceMount={forceMount}>
      <div
        ref={composedRef}
        id={item.contentId}
        data-state={open ? "open" : "closed"}
        data-side={floating.placement.split("-")[0]}
        data-surface-fill={surface}
        aria-labelledby={item.triggerId}
        style={{
          ...style,
          position: floating.strategy,
          top: Math.round(floating.y ?? 0),
          left: Math.round(floating.x ?? 0),
        }}
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
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (event.key === "Escape") {
            event.preventDefault()
            root.setValue("")
            root.triggerRefs.get(item.itemId)?.focus()
            return
          }
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
          const items = contentItems(event.currentTarget)
          const index = items.indexOf(event.target as HTMLElement)
          if (index < 0) return
          event.preventDefault()
          items[event.key === "ArrowDown" ? index + 1 : index - 1]?.focus()
        }}
        onBlur={(event) => {
          onBlur?.(event)
          if (event.defaultPrevented) return
          // Focus leaving the panel, other than back to its own trigger,
          // closes it: Tab past the last link lands on the next item.
          const next = event.relatedTarget as Node | null
          if (!next || event.currentTarget.contains(next)) return
          if (root.triggerRefs.get(item.itemId)?.contains(next)) return
          root.setValue("")
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

interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function NavigationMenuIndicator({
  className,
  ref,
  style,
  ...rest
}: NavigationMenuIndicatorProps) {
  const root = useNavigationMenuRoot("NavigationMenuIndicator")
  const visible = root.value !== ""
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const composedRef = useComposedRefs(localRef, ref)

  const [position, setPosition] = React.useState<{
    start: number
    width: number
  } | null>(null)

  // Measured against the padding box of the element the indicator is
  // absolutely positioned in, as an offset from its inline start.
  React.useLayoutEffect(() => {
    if (!visible) {
      setPosition(null)
      return
    }
    const measure = () => {
      const trigger = root.triggerRefs.get(root.value)
      const host = localRef.current?.offsetParent
      if (!trigger || !(host instanceof HTMLElement)) return
      const rect = trigger.getBoundingClientRect()
      const hostRect = host.getBoundingClientRect()
      const start =
        getDirection(host) === "rtl"
          ? hostRect.left + host.clientLeft + host.clientWidth - rect.right
          : rect.left - hostRect.left - host.clientLeft
      setPosition({ start, width: rect.width })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [root.value, root.triggerRefs, visible])

  return (
    <div
      ref={composedRef}
      data-state={visible ? "visible" : "hidden"}
      style={
        position
          ? {
              ...style,
              insetInlineStart: position.start,
              width: position.width,
            }
          : style
      }
      className={cn("dr-navigation-menu-indicator", className)}
      {...rest}
    >
      <div className="dr-navigation-menu-indicator-arrow" />
    </div>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
}
