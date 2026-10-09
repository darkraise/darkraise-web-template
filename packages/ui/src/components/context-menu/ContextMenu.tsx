import * as React from "react"
import { Check, ChevronRight, Circle, Minus } from "lucide-react"

import { cn } from "@lib/utils"
import { getDirection, inlineArrow } from "@lib/direction"
import type { SurfaceFill } from "@lib/surface-fill"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, useComposedRefs } from "@primitives/slot"
import { placementOf, resolveSide, useFloating } from "@primitives/floating"
import { useMenu, type UseMenuReturn } from "@components/_internal/useMenu"
import { useMenuItem } from "@components/_internal/useMenuItem"
import { createForceMountScope } from "@components/_internal/forceMountScope"
import "@components/menu-primitives/menu-primitives.css"

interface VirtualPoint {
  x: number
  y: number
}

interface ContextMenuContextValue extends UseMenuReturn {
  point: VirtualPoint | null
  setPoint: (next: VirtualPoint | null) => void
  contentRef: React.RefObject<HTMLDivElement | null>
  parent: ContextMenuContextValue | null
  isSubmenu: boolean
  closeAll: () => void
  closeSelf: () => void
  /** Reference element for submenus. */
  setSubmenuReference: (node: HTMLElement | null) => void
  submenuReference: HTMLElement | null
  /** The trigger area, as state so popup content can read it in render. */
  setTriggerArea: (node: HTMLElement | null) => void
  triggerArea: HTMLElement | null
  dir: "ltr" | "rtl" | undefined
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(
  null,
)

function useContextMenuContext(consumer: string): ContextMenuContextValue {
  const ctx = React.useContext(ContextMenuContext)
  if (!ctx) throw new Error(`${consumer} must be used within <ContextMenu>`)
  return ctx
}

const {
  ForceMountProvider: ContextMenuForceMount,
  useResolvedForceMount: useContextMenuForceMount,
} = createForceMountScope()

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

interface ContextMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  dir?: "ltr" | "rtl"
  children?: React.ReactNode
}

function ContextMenu({
  open,
  defaultOpen,
  onOpenChange,
  dir,
  children,
}: ContextMenuProps) {
  return (
    <ContextMenuRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      dir={dir}
      isSubmenu={false}
    >
      {children}
    </ContextMenuRoot>
  )
}

interface ContextMenuRootInternalProps extends ContextMenuProps {
  isSubmenu: boolean
}

function ContextMenuRoot({
  open,
  defaultOpen,
  onOpenChange,
  isSubmenu,
  dir,
  children,
}: ContextMenuRootInternalProps) {
  const menu = useMenu({ open, defaultOpen, onOpenChange })
  const parent = React.useContext(ContextMenuContext)
  const [point, setPoint] = React.useState<VirtualPoint | null>(null)
  // Cleared during the closing render rather than in an effect, so a
  // right-click that reopens the menu before an effect ran keeps its point.
  const [pointOpen, setPointOpen] = React.useState(menu.open)
  if (pointOpen !== menu.open) {
    setPointOpen(menu.open)
    if (!menu.open) setPoint(null)
  }
  const [submenuReference, setSubmenuReferenceState] =
    React.useState<HTMLElement | null>(null)
  const [triggerArea, setTriggerArea] = React.useState<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const setSubmenuReference = React.useCallback((node: HTMLElement | null) => {
    setSubmenuReferenceState((prev) => (prev === node ? prev : node))
  }, [])

  const closeAll = React.useCallback(() => {
    let cur: ContextMenuContextValue | null = parent
    while (cur) {
      cur.setOpen(false)
      cur = cur.parent
    }
    menu.setOpen(false)
  }, [menu, parent])

  const closeSelf = React.useCallback(() => {
    menu.setOpen(false)
  }, [menu])

  const value = React.useMemo<ContextMenuContextValue>(
    () => ({
      ...menu,
      point,
      setPoint,
      contentRef,
      parent,
      isSubmenu,
      closeAll,
      closeSelf,
      setSubmenuReference,
      submenuReference,
      setTriggerArea,
      triggerArea,
      dir,
    }),
    [
      menu,
      point,
      parent,
      isSubmenu,
      closeAll,
      closeSelf,
      setSubmenuReference,
      submenuReference,
      triggerArea,
      dir,
    ],
  )

  return (
    <ContextMenuContext.Provider value={value}>
      <ContextMenuForceMount>{children}</ContextMenuForceMount>
    </ContextMenuContext.Provider>
  )
}

interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean
  disabled?: boolean
  ref?: React.Ref<HTMLSpanElement>
}

function ContextMenuTrigger({
  asChild,
  disabled,
  onContextMenu,
  ref,
  ...rest
}: ContextMenuTriggerProps) {
  const ctx = useContextMenuContext("ContextMenuTrigger")
  const Comp = asChild ? Slot : "span"
  const composedRef = useComposedRefs(ctx.setTriggerArea, ref)

  return (
    <Comp
      ref={composedRef}
      dir={ctx.dir}
      data-state={ctx.state}
      data-disabled={disabled || undefined}
      onContextMenu={(event: React.MouseEvent<HTMLSpanElement>) => {
        onContextMenu?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        event.preventDefault()
        ctx.setPoint({ x: event.clientX, y: event.clientY })
        ctx.setOpen(true)
      }}
      {...rest}
    />
  )
}

const ContextMenuGroup = ({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="group" {...rest}>
    {children}
  </div>
)

interface ContextMenuPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function ContextMenuPortal({
  container,
  forceMount,
  children,
}: ContextMenuPortalProps) {
  void useContextMenuContext("ContextMenuPortal")
  return (
    <ContextMenuForceMount forceMount={forceMount}>
      <Portal container={container}>{children}</Portal>
    </ContextMenuForceMount>
  )
}

interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  loop?: boolean
  forceMount?: boolean
  collisionPadding?: number
  avoidCollisions?: boolean
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
  ref?: React.Ref<HTMLDivElement>
  /** Which plane the surface paints; nested non-portalled surfaces inherit it. */
  surface?: SurfaceFill
}

function buildVirtualReference(point: VirtualPoint) {
  return {
    getBoundingClientRect() {
      return {
        x: point.x,
        y: point.y,
        top: point.y,
        left: point.x,
        bottom: point.y,
        right: point.x,
        width: 0,
        height: 0,
      } as DOMRect
    },
  }
}

function ContextMenuContentImpl({
  className,
  children,
  collisionPadding = 8,
  avoidCollisions = true,
  loop = true,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  surface,
  ref,
  style,
  ...rest
}: Omit<ContextMenuContentProps, "forceMount">) {
  const ctx = useContextMenuContext("ContextMenuContent")

  // The root menu opens at the pointer; a submenu anchors to its live
  // sub-trigger, so it follows the row wherever the parent menu settles.
  const floating = useFloating({
    placement: ctx.isSubmenu
      ? placementOf(resolveSide("end", ctx.submenuReference), "start")
      : "bottom-start",
    sideOffset: 0,
    alignOffset: 0,
    avoidCollisions,
    collisionPadding,
    open: ctx.open,
  })

  // The root menu anchors to the pointer of the right-click that opened it.
  // Opened through its props there is no pointer, so it anchors to its
  // trigger. A closing menu keeps its anchor through the exit animation.
  // `setReference` ignores a DOM element once a virtual pointer has been set,
  // so every anchor goes through `setPositionReference`, whose fresh wrapper
  // on each open also makes a still-mounted menu measure again.
  const setPositionReference = floating.refs.setPositionReference
  React.useLayoutEffect(() => {
    if (ctx.isSubmenu) {
      setPositionReference(ctx.submenuReference)
      return
    }
    if (!ctx.open) return
    setPositionReference(
      ctx.point ? buildVirtualReference(ctx.point) : ctx.triggerArea,
    )
  }, [
    ctx.isSubmenu,
    ctx.submenuReference,
    ctx.open,
    ctx.point,
    ctx.triggerArea,
    setPositionReference,
  ])

  // The root menu mounts at the viewport origin before its anchor is
  // measured; shown there, a still pointer would hover its rows. A hidden
  // element cannot take focus, so focus waits until the menu is shown. A menu
  // with neither a point nor a trigger has nothing to wait for. A closing
  // menu stays shown where it was, through its exit animation.
  const anchored = ctx.point !== null || ctx.triggerArea !== null
  const shown = ctx.isSubmenu || !anchored || !ctx.open || floating.isPositioned

  React.useEffect(() => {
    if (!ctx.open || !shown) return
    queueMicrotask(() => {
      ctx.contentRef.current?.focus({ preventScroll: true })
    })
  }, [ctx.open, shown, ctx.contentRef])

  const onCloseAutoFocusRef = React.useRef(onCloseAutoFocus)
  React.useEffect(() => {
    onCloseAutoFocusRef.current = onCloseAutoFocus
  })

  React.useEffect(() => {
    return () => {
      const event = new Event("closeAutoFocus", { cancelable: true })
      onCloseAutoFocusRef.current?.(event)
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      ctx.focusNext({ loop })
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      ctx.focusPrev({ loop })
    } else if (event.key === "Home") {
      event.preventDefault()
      ctx.focusFirst()
    } else if (event.key === "End") {
      event.preventDefault()
      ctx.focusLast()
    } else if (event.key === "Tab") {
      event.preventDefault()
      ctx.closeAll()
    } else if (
      ctx.isSubmenu &&
      inlineArrow(event.key, event.currentTarget) === "prev"
    ) {
      event.preventDefault()
      ctx.closeSelf()
    } else if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      ctx.typeahead(event.key)
    }
  }

  const composedRef = useComposedRefs(
    ctx.contentRef as React.Ref<HTMLDivElement>,
    floating.refs.setFloating,
    ref,
  )

  return (
    <DismissableLayer
      active={ctx.open}
      onPointerDownOutside={(event) => {
        onPointerDownOutside?.(event)
        onInteractOutside?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(false)
      }}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(false)
      }}
      onFocusOutside={(event) => {
        onInteractOutside?.(event)
      }}
    >
      <div
        ref={composedRef}
        role="menu"
        id={ctx.contentId}
        dir={
          ctx.dir ??
          getDirection(ctx.isSubmenu ? ctx.submenuReference : ctx.triggerArea)
        }
        data-state={ctx.state}
        data-surface-fill={surface}
        tabIndex={-1}
        style={{
          ...style,
          position: floating.strategy,
          top: Math.round(floating.y ?? 0),
          left: Math.round(floating.x ?? 0),
          ...(!shown && { visibility: "hidden" }),
        }}
        className={cn("dr-menu-content", className)}
        {...rest}
        onKeyDown={(event) => {
          rest.onKeyDown?.(event)
          if (event.defaultPrevented) return
          handleKeyDown(event)
        }}
      >
        {children}
      </div>
    </DismissableLayer>
  )
}

function ContextMenuContent({
  forceMount: forceMountProp,
  ...props
}: ContextMenuContentProps) {
  const ctx = useContextMenuContext("ContextMenuContent")
  const forceMount = useContextMenuForceMount(forceMountProp)
  return (
    <ContextMenuPortal forceMount={forceMount}>
      <Presence present={ctx.open} forceMount={forceMount}>
        <ContextMenuContentImpl {...props} />
      </Presence>
    </ContextMenuPortal>
  )
}

interface ContextMenuItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  inset?: boolean
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  asChild?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function ContextMenuItem({
  className,
  inset,
  disabled,
  textValue,
  onSelect,
  onClick,
  onAuxClick,
  onPointerEnter,
  onKeyDown,
  asChild,
  ref,
  children,
  ...rest
}: ContextMenuItemProps) {
  const ctx = useContextMenuContext("ContextMenuItem")
  const { localRef, composedRef, isFocused, id } = useMenuItem({
    registerItem: ctx.registerItem,
    unregisterItem: ctx.unregisterItem,
    focusedId: ctx.focusedId,
    ref,
    disabled,
    textValue,
    children,
  })
  const Comp = asChild ? Slot : "div"

  const triggerSelect = (event: Event | React.SyntheticEvent) => {
    if (disabled) return
    const nativeEvent =
      "nativeEvent" in event
        ? (event as React.SyntheticEvent).nativeEvent
        : event
    const ev = nativeEvent as Event
    onSelect?.(ev)
    if (!(ev as Event & { defaultPrevented?: boolean }).defaultPrevented) {
      ctx.closeAll()
    }
  }

  return (
    <Comp
      ref={composedRef}
      role="menuitem"
      tabIndex={isFocused ? 0 : -1}
      data-disabled={disabled || undefined}
      data-highlighted={isFocused ? "" : undefined}
      aria-disabled={disabled || undefined}
      onPointerEnter={(event: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event)
        // Moving onto any item collapses the submenu this menu was holding
        // open, unless this item is the sub-trigger holding it.
        ctx.closeOpenSubmenu(localRef.current)
        if (disabled) return
        ctx.setFocusedId(id)
      }}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) {
          event.preventDefault()
          return
        }
        triggerSelect(event)
      }}
      onAuxClick={(event: React.MouseEvent<HTMLDivElement>) => {
        onAuxClick?.(event)
        // A middle-click on a disabled link item must not open the link.
        if (disabled) event.preventDefault()
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          triggerSelect(event)
        }
      }}
      className={cn("dr-menu-item", inset && "ps-8", className)}
      {...rest}
    >
      {children}
    </Comp>
  )
}

interface ContextMenuCheckboxItemProps extends Omit<
  ContextMenuItemProps,
  "onSelect"
> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
  onSelect?: (event: Event) => void
}

function ContextMenuCheckboxItem({
  className,
  checked,
  onCheckedChange,
  onSelect,
  children,
  disabled,
  ...rest
}: ContextMenuCheckboxItemProps) {
  const isChecked = checked === true || checked === "indeterminate"
  return (
    <ContextMenuItem
      role="menuitemcheckbox"
      aria-checked={
        checked === "indeterminate" ? "mixed" : isChecked ? "true" : "false"
      }
      data-state={
        checked === "indeterminate"
          ? "indeterminate"
          : isChecked
            ? "checked"
            : "unchecked"
      }
      disabled={disabled}
      onSelect={(event) => {
        onSelect?.(event)
        if ((event as Event & { defaultPrevented?: boolean }).defaultPrevented)
          return
        onCheckedChange?.(!isChecked)
      }}
      className={cn("dr-menu-checkbox-item", className)}
      {...rest}
    >
      <span className="absolute start-2 flex size-[var(--icon-size-sm)] items-center justify-center">
        {checked === "indeterminate" ? (
          <Minus className="size-[var(--icon-size)]" aria-hidden="true" />
        ) : isChecked ? (
          <Check className="size-[var(--icon-size)]" aria-hidden="true" />
        ) : null}
      </span>
      {children}
    </ContextMenuItem>
  )
}

interface ContextMenuRadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

function ContextMenuRadioGroup({
  value,
  onValueChange,
  children,
}: ContextMenuRadioGroupProps) {
  const ctx = React.useMemo(
    () => ({ value, onValueChange }),
    [value, onValueChange],
  )
  return (
    <RadioGroupContext.Provider value={ctx}>
      <div role="group">{children}</div>
    </RadioGroupContext.Provider>
  )
}

interface ContextMenuRadioItemProps extends Omit<
  ContextMenuItemProps,
  "onSelect"
> {
  value: string
  onSelect?: (event: Event) => void
}

function ContextMenuRadioItem({
  className,
  value,
  onSelect,
  children,
  ...rest
}: ContextMenuRadioItemProps) {
  const radio = React.useContext(RadioGroupContext)
  const checked = radio?.value === value
  return (
    <ContextMenuItem
      role="menuitemradio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onSelect={(event) => {
        onSelect?.(event)
        if ((event as Event & { defaultPrevented?: boolean }).defaultPrevented)
          return
        radio?.onValueChange?.(value)
      }}
      className={cn("dr-menu-radio-item", className)}
      {...rest}
    >
      <span className="absolute start-2 flex size-[var(--icon-size-sm)] items-center justify-center">
        {checked ? (
          <Circle
            className="size-[calc(var(--icon-size)*0.5)] fill-current"
            aria-hidden="true"
          />
        ) : null}
      </span>
      {children}
    </ContextMenuItem>
  )
}

interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function ContextMenuLabel({
  className,
  inset,
  ref,
  ...rest
}: ContextMenuLabelProps) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("dr-menu-label", inset && "ps-8", className)}
      {...rest}
    />
  )
}

interface ContextMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function ContextMenuSeparator({
  className,
  ref,
  ...rest
}: ContextMenuSeparatorProps) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cn("dr-menu-separator", className)}
      {...rest}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("dr-menu-shortcut", className)} {...rest} />
}

interface ContextMenuSubProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function ContextMenuSub({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: ContextMenuSubProps) {
  return (
    <ContextMenuRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isSubmenu
    >
      {children}
    </ContextMenuRoot>
  )
}

interface ContextMenuSubTriggerProps extends Omit<
  ContextMenuItemProps,
  "onSelect"
> {
  ref?: React.Ref<HTMLDivElement>
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  onPointerEnter,
  onClick,
  onKeyDown,
  disabled,
  ref,
  ...rest
}: ContextMenuSubTriggerProps) {
  const ctx = useContextMenuContext("ContextMenuSubTrigger")
  const localRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    ctx.setSubmenuReference(localRef.current)
  }, [ctx])

  const parent = ctx.parent
  const openSelf = () => {
    parent?.closeOpenSubmenu(localRef.current)
    parent?.registerOpenSubmenu({
      trigger: localRef.current,
      close: ctx.closeSelf,
    })
    ctx.setOpen(true)
  }

  const composedRef = useComposedRefs(localRef, ref)

  // The row is an item of the parent menu: registered there, the arrow keys
  // of the parent reach it and the submenu lists only its own items.
  return (
    <ContextMenuContext.Provider value={parent ?? ctx}>
      <ContextMenuItem
        ref={composedRef}
        aria-haspopup="menu"
        disabled={disabled}
        aria-expanded={ctx.open}
        data-state={ctx.state}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          if (event.defaultPrevented || disabled) return
          if (!ctx.open) openSelf()
        }}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented || disabled) return
          openSelf()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || disabled) return
          if (
            inlineArrow(event.key, event.currentTarget) === "next" ||
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault()
            openSelf()
            requestAnimationFrame(() => ctx.focusFirst())
          }
        }}
        onSelect={(event) => {
          ;(event as Event & { preventDefault: () => void }).preventDefault?.()
        }}
        className={cn("dr-menu-sub-trigger", inset && "ps-8", className)}
        {...rest}
      >
        {children}
        <ChevronRight className="dr-icon-inline ms-auto" aria-hidden="true" />
      </ContextMenuItem>
    </ContextMenuContext.Provider>
  )
}

type ContextMenuSubContentProps = ContextMenuContentProps

function ContextMenuSubContent({
  className,
  ...rest
}: ContextMenuSubContentProps) {
  return (
    <ContextMenuContent
      className={cn("dr-menu-sub-content", className)}
      {...rest}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
