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

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

interface DropdownMenuContextValue extends UseMenuReturn {
  setReference: (node: HTMLElement | null) => void
  reference: HTMLElement | null
  contentRef: React.RefObject<HTMLDivElement | null>
  parent: DropdownMenuContextValue | null
  isSubmenu: boolean
  closeAll: () => void
  /** Close this menu and any descendant submenus. */
  closeSelf: () => void
}

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null)

function useDropdownContext(consumer: string): DropdownMenuContextValue {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) throw new Error(`${consumer} must be used within <DropdownMenu>`)
  return ctx
}

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  dir?: "ltr" | "rtl"
  children?: React.ReactNode
}

function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  return (
    <DropdownMenuRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isSubmenu={false}
    >
      {children}
    </DropdownMenuRoot>
  )
}

interface DropdownMenuRootInternalProps extends DropdownMenuProps {
  isSubmenu: boolean
}

function DropdownMenuRoot({
  open,
  defaultOpen,
  onOpenChange,
  isSubmenu,
  children,
}: DropdownMenuRootInternalProps) {
  const menu = useMenu({ open, defaultOpen, onOpenChange })
  const parent = React.useContext(DropdownMenuContext)
  const [reference, setReferenceState] = React.useState<HTMLElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const setReference = React.useCallback((node: HTMLElement | null) => {
    setReferenceState((prev) => (prev === node ? prev : node))
  }, [])

  const closeAll = React.useCallback(() => {
    let cur: DropdownMenuContextValue | null = parent
    while (cur) {
      cur.setOpen(false)
      cur = cur.parent
    }
    menu.setOpen(false)
  }, [menu, parent])

  const closeSelf = React.useCallback(() => {
    menu.setOpen(false)
  }, [menu])

  const value = React.useMemo<DropdownMenuContextValue>(
    () => ({
      ...menu,
      setReference,
      reference,
      contentRef,
      parent,
      isSubmenu,
      closeAll,
      closeSelf,
    }),
    [menu, reference, parent, isSubmenu, closeAll, closeSelf, setReference],
  )

  return (
    <DropdownMenuContext.Provider value={value}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuGroup = ({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="group" {...rest}>
    {children}
  </div>
)

interface DropdownMenuPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function DropdownMenuPortal({
  container,
  forceMount,
  children,
}: DropdownMenuPortalProps) {
  void useDropdownContext("DropdownMenuPortal")
  void forceMount
  return <Portal container={container}>{children}</Portal>
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function DropdownMenuTrigger({
  asChild,
  type,
  onClick,
  onKeyDown,
  onPointerDown,
  ref,
  ...rest
}: DropdownMenuTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const ctx = useDropdownContext("DropdownMenuTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={composeRefs(ctx.setReference as React.Ref<HTMLButtonElement>, ref)}
      type={resolvedType}
      id={ctx.triggerId}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.state}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        // pointerdown opens; click handles toggle.
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggle()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (
          event.key === "ArrowDown" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault()
          if (!ctx.open) ctx.setOpen(true)
          // Defer focusFirst until after content mounts.
          requestAnimationFrame(() => ctx.focusFirst())
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          if (!ctx.open) ctx.setOpen(true)
          requestAnimationFrame(() => ctx.focusLast())
        }
      }}
      {...rest}
    />
  )
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  loop?: boolean
  forceMount?: boolean
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
  ref?: React.Ref<HTMLDivElement>
}

function placementOf(side: Side, align: Align) {
  return align === "center" ? side : (`${side}-${align}` as const)
}

function DropdownMenuContentImpl({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  avoidCollisions = true,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...rest
}: Omit<DropdownMenuContentProps, "forceMount" | "loop">) {
  const ctx = useDropdownContext("DropdownMenuContent")

  const placement = placementOf(side, align)
  const floating = useFloating({
    placement: placement as never,
    sideOffset,
    alignOffset,
    avoidCollisions,
    collisionPadding,
  })

  const setReferenceFloat = floating.refs.setReference
  React.useEffect(() => {
    setReferenceFloat(ctx.reference ?? null)
  }, [ctx.reference, setReferenceFloat])

  const lastFocusRef = React.useRef<HTMLDivElement | null>(null)

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
      if (event.defaultPrevented) return
      const ref = ctx.reference
      if (ref instanceof HTMLElement) ref.focus({ preventScroll: true })
    }
    // We only want this on unmount of the *content* element. Empty deps suffice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } else if (event.key === "Escape") {
      // Bubbles to DismissableLayer.
      return
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
      // Typeahead.
      ctx.typeahead(event.key)
    }
  }

  const [resolvedSide] = React.useMemo(() => {
    const p = floating.placement
    const [s] = p.split("-") as [Side]
    return [s] as const
  }, [floating.placement])

  return (
    <DismissableLayer
      onPointerDownOutside={(event) => {
        onPointerDownOutside?.(event)
        onInteractOutside?.(event)
        if (event.defaultPrevented) return
        if (
          event.target instanceof Node &&
          ctx.reference?.contains(event.target)
        )
          return
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
          lastFocusRef,
          ref,
        )}
        role="menu"
        id={ctx.contentId}
        data-state={ctx.state}
        data-side={resolvedSide}
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

function DropdownMenuContent({
  forceMount,
  ...props
}: DropdownMenuContentProps) {
  const ctx = useDropdownContext("DropdownMenuContent")
  return (
    <DropdownMenuPortal forceMount={forceMount}>
      <Presence present={ctx.open} forceMount={forceMount}>
        <DropdownMenuContentImpl {...props} />
      </Presence>
    </DropdownMenuPortal>
  )
}

interface DropdownMenuItemProps extends Omit<
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
  const ctx = useDropdownContext("DropdownMenuItem")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  // Hold a single stable descriptor for this item; mutate fields in place so
  // re-registering does not bounce useMenu state and trigger re-render loops.
  const descriptorRef = React.useRef<MenuItemDescriptor | null>(null)
  if (descriptorRef.current === null) {
    descriptorRef.current = {
      value: Math.random().toString(36).slice(2),
      textValue: textValue ?? "",
      disabled: !!disabled,
      ref: localRef,
    }
  }
  // Keep descriptor fields in sync with current props every render.
  if (descriptorRef.current) {
    descriptorRef.current.disabled = !!disabled
    if (textValue !== undefined) {
      descriptorRef.current.textValue = textValue
    }
  }

  // Register on mount, deregister on unmount only.
  const registerItem = ctx.registerItem
  React.useEffect(() => {
    const descriptor = descriptorRef.current
    if (!descriptor) return
    return registerItem(descriptor)
    // Stable: registerItem is wrapped in useCallback with [] deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync auto-derived textValue from DOM after mount.
  React.useEffect(() => {
    if (textValue !== undefined) return
    const node = localRef.current
    const descriptor = descriptorRef.current
    if (node && descriptor) {
      descriptor.textValue = node.textContent ?? ""
    }
  })

  // Read items each render so myIndex stays current.
  const sortedItems = ctx.items()
  const myIndex = sortedItems.findIndex((it) => it === descriptorRef.current)
  const isFocused = myIndex >= 0 && ctx.focusedIndex === myIndex

  // Apply focus when this is the focused item and menu is open.
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

function DropdownMenuItem({
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
}: DropdownMenuItemProps) {
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

interface DropdownMenuCheckboxItemProps extends Omit<
  DropdownMenuItemProps,
  "onSelect"
> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
  onSelect?: (event: Event) => void
}

function DropdownMenuCheckboxItem({
  className,
  checked,
  onCheckedChange,
  onSelect,
  children,
  disabled,
  ...rest
}: DropdownMenuCheckboxItemProps) {
  const isChecked = checked === true || checked === "indeterminate"
  return (
    <DropdownMenuItem
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
    </DropdownMenuItem>
  )
}

interface DropdownMenuRadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: DropdownMenuRadioGroupProps) {
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

interface DropdownMenuRadioItemProps extends Omit<
  DropdownMenuItemProps,
  "onSelect"
> {
  value: string
  onSelect?: (event: Event) => void
}

function DropdownMenuRadioItem({
  className,
  value,
  onSelect,
  children,
  ...rest
}: DropdownMenuRadioItemProps) {
  const radio = React.useContext(RadioGroupContext)
  const checked = radio?.value === value
  return (
    <DropdownMenuItem
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
    </DropdownMenuItem>
  )
}

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function DropdownMenuLabel({
  className,
  inset,
  ref,
  ...rest
}: DropdownMenuLabelProps) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("dr-menu-label", inset && "pl-8", className)}
      {...rest}
    />
  )
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function DropdownMenuSeparator({
  className,
  ref,
  ...rest
}: DropdownMenuSeparatorProps) {
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

const DropdownMenuShortcut = ({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("dr-menu-shortcut", className)} {...rest} />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

interface DropdownMenuSubProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function DropdownMenuSub({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: DropdownMenuSubProps) {
  return (
    <DropdownMenuRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isSubmenu
    >
      {children}
    </DropdownMenuRoot>
  )
}

interface DropdownMenuSubTriggerProps extends Omit<
  DropdownMenuItemProps,
  "onSelect"
> {
  ref?: React.Ref<HTMLDivElement>
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  onPointerEnter,
  onClick,
  onKeyDown,
  ref,
  ...rest
}: DropdownMenuSubTriggerProps) {
  const ctx = useDropdownContext("DropdownMenuSubTrigger")
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const setReference = ctx.setReference
  React.useEffect(() => {
    setReference(localRef.current)
  }, [setReference])

  return (
    <DropdownMenuItem
      ref={composeRefs(localRef, ref ?? undefined)}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      data-state={ctx.state}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (!ctx.open) ctx.setOpen(true)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (!ctx.open) ctx.setOpen(true)
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
          ctx.setOpen(true)
          requestAnimationFrame(() => ctx.focusFirst())
        }
      }}
      onSelect={(event) => {
        // Submenu items don't close the parent on select.
        ;(event as Event & { preventDefault: () => void }).preventDefault?.()
      }}
      className={cn("dr-menu-sub-trigger", inset && "pl-8", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenuItem>
  )
}

type DropdownMenuSubContentProps = DropdownMenuContentProps

function DropdownMenuSubContent({
  className,
  side = "right",
  align = "start",
  sideOffset = 0,
  ...rest
}: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn("dr-menu-sub-content", className)}
      {...rest}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
