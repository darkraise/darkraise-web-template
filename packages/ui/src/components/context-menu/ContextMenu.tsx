"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@lib/utils"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import {
  useMenu,
  type MenuItemDescriptor,
  type UseMenuReturn,
} from "@components/_internal/useMenu"
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
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(
  null,
)

function useContextMenuContext(consumer: string): ContextMenuContextValue {
  const ctx = React.useContext(ContextMenuContext)
  if (!ctx) throw new Error(`${consumer} must be used within <ContextMenu>`)
  return ctx
}

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
  children,
}: ContextMenuProps) {
  return (
    <ContextMenuRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
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
  children,
}: ContextMenuRootInternalProps) {
  const menu = useMenu({ open, defaultOpen, onOpenChange })
  const parent = React.useContext(ContextMenuContext)
  const [point, setPoint] = React.useState<VirtualPoint | null>(null)
  const [submenuReference, setSubmenuReferenceState] =
    React.useState<HTMLElement | null>(null)
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
    ],
  )

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
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
  return (
    <Comp
      ref={ref}
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
  const ctx = useContextMenuContext("ContextMenuPortal")
  if (!forceMount && !ctx.open) return null
  return <Portal container={container}>{children}</Portal>
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
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...rest
}: Omit<ContextMenuContentProps, "forceMount" | "loop">) {
  const ctx = useContextMenuContext("ContextMenuContent")

  const floating = useFloating({
    placement: "bottom-start",
    sideOffset: 0,
    alignOffset: 0,
    avoidCollisions,
    collisionPadding,
  })

  const setReferenceFloat = floating.refs.setReference
  React.useEffect(() => {
    if (!ctx.point) return
    setReferenceFloat(buildVirtualReference(ctx.point))
  }, [ctx.point, setReferenceFloat])

  React.useEffect(() => {
    if (!ctx.open) return
    queueMicrotask(() => {
      ctx.contentRef.current?.focus({ preventScroll: true })
    })
  }, [ctx.open, ctx.contentRef])

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
      ctx.focusNext()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      ctx.focusPrev()
    } else if (event.key === "Home") {
      event.preventDefault()
      ctx.focusFirst()
    } else if (event.key === "End") {
      event.preventDefault()
      ctx.focusLast()
    } else if (event.key === "Tab") {
      event.preventDefault()
      ctx.closeAll()
    } else if (event.key === "ArrowLeft" && ctx.isSubmenu) {
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

  return (
    <DismissableLayer
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
        ref={composeRefs(
          ctx.contentRef as React.Ref<HTMLDivElement>,
          floating.refs.setFloating,
          ref,
        )}
        role="menu"
        id={ctx.contentId}
        data-state={ctx.state}
        tabIndex={-1}
        style={{
          position: floating.strategy,
          top: floating.y ?? 0,
          left: floating.x ?? 0,
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

function ContextMenuContent({ forceMount, ...props }: ContextMenuContentProps) {
  const ctx = useContextMenuContext("ContextMenuContent")
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

function useMenuItem({
  ref,
  disabled,
  textValue,
}: {
  ref?: React.Ref<HTMLDivElement>
  disabled?: boolean
  textValue?: string
}) {
  const ctx = useContextMenuContext("ContextMenuItem")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  const descriptorRef = React.useRef<MenuItemDescriptor | null>(null)
  if (descriptorRef.current === null) {
    descriptorRef.current = {
      value: Math.random().toString(36).slice(2),
      textValue: textValue ?? "",
      disabled: !!disabled,
      ref: localRef,
    }
  }
  if (descriptorRef.current) {
    descriptorRef.current.disabled = !!disabled
    if (textValue !== undefined) {
      descriptorRef.current.textValue = textValue
    }
  }

  const registerItem = ctx.registerItem
  React.useEffect(() => {
    const descriptor = descriptorRef.current
    if (!descriptor) return
    return registerItem(descriptor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (textValue !== undefined) return
    const node = localRef.current
    const descriptor = descriptorRef.current
    if (node && descriptor) {
      descriptor.textValue = node.textContent ?? ""
    }
  })

  const sortedItems = ctx.items()
  const myIndex = sortedItems.findIndex((it) => it === descriptorRef.current)
  const isFocused = myIndex >= 0 && ctx.focusedIndex === myIndex

  React.useEffect(() => {
    if (isFocused) localRef.current?.focus({ preventScroll: true })
  }, [isFocused])

  return {
    localRef,
    composedRef: composeRefs(localRef, ref ?? undefined),
    isFocused,
    myIndex,
    ctx,
  }
}

function ContextMenuItem({
  className,
  inset,
  disabled,
  textValue,
  onSelect,
  onClick,
  onPointerEnter,
  onKeyDown,
  asChild,
  ref,
  children,
  ...rest
}: ContextMenuItemProps) {
  const { composedRef, isFocused, myIndex, ctx } = useMenuItem({
    ref,
    disabled,
    textValue,
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
        if (disabled) return
        if (myIndex >= 0) ctx.setFocusedIndex(myIndex)
      }}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        triggerSelect(event)
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          triggerSelect(event)
        }
      }}
      className={cn("dr-menu-item", inset && "pl-8", className)}
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
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isChecked ? <Check className="h-4 w-4" /> : null}
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
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Circle className="h-2 w-2 fill-current" /> : null}
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
      className={cn("dr-menu-label", inset && "pl-8", className)}
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
  ref,
  ...rest
}: ContextMenuSubTriggerProps) {
  const ctx = useContextMenuContext("ContextMenuSubTrigger")
  const localRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    ctx.setSubmenuReference(localRef.current)
  }, [ctx])

  return (
    <ContextMenuItem
      ref={composeRefs(localRef, ref ?? undefined)}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      data-state={ctx.state}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (!ctx.open) {
          const rect = localRef.current?.getBoundingClientRect()
          if (rect) {
            ctx.setPoint({ x: rect.right, y: rect.top })
          }
          ctx.setOpen(true)
        }
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        const rect = localRef.current?.getBoundingClientRect()
        if (rect) ctx.setPoint({ x: rect.right, y: rect.top })
        ctx.setOpen(true)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (
          event.key === "ArrowRight" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault()
          const rect = localRef.current?.getBoundingClientRect()
          if (rect) ctx.setPoint({ x: rect.right, y: rect.top })
          ctx.setOpen(true)
          requestAnimationFrame(() => ctx.focusFirst())
        }
      }}
      onSelect={(event) => {
        ;(event as Event & { preventDefault: () => void }).preventDefault?.()
      }}
      className={cn("dr-menu-sub-trigger", inset && "pl-8", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </ContextMenuItem>
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
