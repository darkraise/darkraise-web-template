"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@lib/utils"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import { useControllableState, useId } from "@primitives/state"
import {
  useMenu,
  type MenuItemDescriptor,
  type UseMenuReturn,
} from "@components/_internal/useMenu"
import "./menubar.css"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

interface MenubarRootContextValue {
  /** id of the menu currently open ("" = none) */
  value: string
  setValue: (next: string) => void
  /** Stable id for each registered top-level Menu. */
  registerMenu: (menuId: string) => () => void
  menus: () => string[]
  loop: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
}

const MenubarRootContext = React.createContext<MenubarRootContextValue | null>(
  null,
)

function useMenubarRoot(consumer: string): MenubarRootContextValue {
  const ctx = React.useContext(MenubarRootContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Menubar>`)
  return ctx
}

interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  loop?: boolean
  dir?: "ltr" | "rtl"
  ref?: React.Ref<HTMLDivElement>
}

function Menubar({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  loop = true,
  ref,
  children,
  ...rest
}: MenubarProps) {
  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  })
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const menusRef = React.useRef<string[]>([])
  const [, setNonce] = React.useState(0)

  const registerMenu = React.useCallback((menuId: string) => {
    menusRef.current = [...menusRef.current, menuId]
    setNonce((n) => n + 1)
    return () => {
      menusRef.current = menusRef.current.filter((id) => id !== menuId)
      setNonce((n) => n + 1)
    }
  }, [])

  const menus = React.useCallback(() => menusRef.current, [])

  const setValueStable = React.useCallback(
    (next: string) => {
      setValue(next)
    },
    [setValue],
  )

  const ctx = React.useMemo<MenubarRootContextValue>(
    () => ({
      value,
      setValue: setValueStable,
      registerMenu,
      menus,
      loop,
      rootRef,
    }),
    [value, setValueStable, registerMenu, menus, loop],
  )

  return (
    <MenubarRootContext.Provider value={ctx}>
      <div
        ref={composeRefs(rootRef, ref ?? undefined)}
        role="menubar"
        className={cn("dr-menubar", className)}
        {...rest}
      >
        {children}
      </div>
    </MenubarRootContext.Provider>
  )
}

interface MenubarMenuContextValue extends UseMenuReturn {
  menuId: string
  setReference: (node: HTMLElement | null) => void
  reference: HTMLElement | null
  contentRef: React.RefObject<HTMLDivElement | null>
  parent: MenubarMenuContextValue | null
  isSubmenu: boolean
  closeAll: () => void
  closeSelf: () => void
}

const MenubarMenuContext = React.createContext<MenubarMenuContextValue | null>(
  null,
)

function useMenubarMenu(consumer: string): MenubarMenuContextValue {
  const ctx = React.useContext(MenubarMenuContext)
  if (!ctx) throw new Error(`${consumer} must be used within <MenubarMenu>`)
  return ctx
}

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
)

interface MenubarMenuProps {
  value?: string
  children?: React.ReactNode
}

function MenubarMenu({ value, children }: MenubarMenuProps) {
  const root = useMenubarRoot("MenubarMenu")
  const generatedId = useId()
  const menuId = value ?? generatedId
  return (
    <MenubarMenuRoot menuId={menuId} root={root} isSubmenu={false}>
      {children}
    </MenubarMenuRoot>
  )
}

interface MenubarMenuRootProps {
  menuId: string
  root: MenubarRootContextValue | null
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isSubmenu: boolean
  children?: React.ReactNode
}

function MenubarMenuRoot({
  menuId,
  root,
  open: openProp,
  defaultOpen,
  onOpenChange,
  isSubmenu,
  children,
}: MenubarMenuRootProps) {
  const open = isSubmenu ? undefined : root ? root.value === menuId : openProp
  const setRootValue = root?.setValue
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isSubmenu && setRootValue) {
        setRootValue(next ? menuId : "")
      }
      onOpenChange?.(next)
    },
    [isSubmenu, setRootValue, menuId, onOpenChange],
  )
  const menu = useMenu({
    open: isSubmenu ? openProp : open,
    defaultOpen,
    onOpenChange: handleOpenChange,
  })

  const parent = React.useContext(MenubarMenuContext)
  const [reference, setReferenceState] = React.useState<HTMLElement | null>(
    null,
  )
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const setReference = React.useCallback((node: HTMLElement | null) => {
    setReferenceState((prev) => (prev === node ? prev : node))
  }, [])

  const closeAll = React.useCallback(() => {
    let cur: MenubarMenuContextValue | null = parent
    while (cur) {
      cur.setOpen(false)
      cur = cur.parent
    }
    menu.setOpen(false)
    if (root && !isSubmenu) root.setValue("")
  }, [menu, parent, root, isSubmenu])

  const closeSelf = React.useCallback(() => {
    menu.setOpen(false)
  }, [menu])

  // Register top-level menu with the root.
  const registerMenu = root?.registerMenu
  React.useEffect(() => {
    if (isSubmenu || !registerMenu) return
    return registerMenu(menuId)
  }, [isSubmenu, registerMenu, menuId])

  const value = React.useMemo<MenubarMenuContextValue>(
    () => ({
      ...menu,
      menuId,
      setReference,
      reference,
      contentRef,
      parent,
      isSubmenu,
      closeAll,
      closeSelf,
    }),
    [
      menu,
      menuId,
      setReference,
      reference,
      parent,
      isSubmenu,
      closeAll,
      closeSelf,
    ],
  )

  return (
    <MenubarMenuContext.Provider value={value}>
      {children}
    </MenubarMenuContext.Provider>
  )
}

const MenubarGroup = ({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="group" {...rest}>
    {children}
  </div>
)

interface MenubarPortalProps {
  container?: Element | null
  forceMount?: boolean
  children?: React.ReactNode
}

function MenubarPortal({
  container,
  forceMount,
  children,
}: MenubarPortalProps) {
  void useMenubarMenu("MenubarPortal")
  void forceMount
  return <Portal container={container}>{children}</Portal>
}

interface MenubarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function MenubarTrigger({
  className,
  asChild,
  type,
  onClick,
  onKeyDown,
  ref,
  ...rest
}: MenubarTriggerProps) {
  const root = useMenubarRoot("MenubarTrigger")
  const ctx = useMenubarMenu("MenubarTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")

  const handleArrowNav = (direction: 1 | -1) => {
    const list = root.menus()
    const i = list.indexOf(ctx.menuId)
    if (i === -1 || list.length === 0) return
    let next = i + direction
    if (next < 0) next = root.loop ? list.length - 1 : 0
    else if (next >= list.length) next = root.loop ? 0 : list.length - 1
    const nextId = list[next]
    if (nextId !== undefined) root.setValue(nextId)
  }

  return (
    <Comp
      ref={composeRefs(ctx.setReference as React.Ref<HTMLButtonElement>, ref)}
      type={resolvedType}
      role="menuitem"
      id={ctx.triggerId}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      data-state={ctx.state}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (ctx.open) {
          root.setValue("")
        } else {
          root.setValue(ctx.menuId)
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "ArrowRight") {
          event.preventDefault()
          handleArrowNav(1)
        } else if (event.key === "ArrowLeft") {
          event.preventDefault()
          handleArrowNav(-1)
        } else if (
          event.key === "ArrowDown" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault()
          if (!ctx.open) root.setValue(ctx.menuId)
          requestAnimationFrame(() => ctx.focusFirst())
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          if (!ctx.open) root.setValue(ctx.menuId)
          requestAnimationFrame(() => ctx.focusLast())
        }
      }}
      className={cn("dr-menubar-trigger", className)}
      {...rest}
    />
  )
}

interface MenubarContentProps extends React.HTMLAttributes<HTMLDivElement> {
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

function MenubarContentImpl({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset = -4,
  collisionPadding = 8,
  avoidCollisions = true,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...rest
}: Omit<MenubarContentProps, "forceMount" | "loop">) {
  const ctx = useMenubarMenu("MenubarContent")
  const root = useMenubarRoot("MenubarContent")

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

  const handleArrowNav = (direction: 1 | -1) => {
    const list = root.menus()
    const i = list.indexOf(ctx.menuId)
    if (i === -1 || list.length === 0) return
    let next = i + direction
    if (next < 0) next = root.loop ? list.length - 1 : 0
    else if (next >= list.length) next = root.loop ? 0 : list.length - 1
    const nextId = list[next]
    if (nextId !== undefined) root.setValue(nextId)
  }

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
    } else if (event.key === "ArrowRight") {
      if (ctx.isSubmenu) return
      event.preventDefault()
      handleArrowNav(1)
    } else if (event.key === "ArrowLeft") {
      if (ctx.isSubmenu) {
        event.preventDefault()
        ctx.closeSelf()
        return
      }
      event.preventDefault()
      handleArrowNav(-1)
    } else if (event.key === "Tab") {
      event.preventDefault()
      ctx.closeAll()
    } else if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
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
        if (
          event.target instanceof Node &&
          root.rootRef.current?.contains(event.target)
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
        className={cn(
          ctx.isSubmenu ? "dr-menubar-sub-content" : "dr-menubar-content",
          className,
        )}
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

function MenubarContent({ forceMount, ...props }: MenubarContentProps) {
  const ctx = useMenubarMenu("MenubarContent")
  return (
    <MenubarPortal forceMount={forceMount}>
      <Presence present={ctx.open} forceMount={forceMount}>
        <MenubarContentImpl {...props} />
      </Presence>
    </MenubarPortal>
  )
}

interface MenubarItemProps extends Omit<
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
  const ctx = useMenubarMenu("MenubarItem")
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

function MenubarItem({
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
}: MenubarItemProps) {
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
      className={cn("dr-menubar-item", inset && "pl-8", className)}
      {...rest}
    >
      {children}
    </Comp>
  )
}

interface MenubarCheckboxItemProps extends Omit<MenubarItemProps, "onSelect"> {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean) => void
  onSelect?: (event: Event) => void
}

function MenubarCheckboxItem({
  className,
  checked,
  onCheckedChange,
  onSelect,
  children,
  disabled,
  ...rest
}: MenubarCheckboxItemProps) {
  const isChecked = checked === true || checked === "indeterminate"
  return (
    <MenubarItem
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
      className={cn("dr-menubar-checkbox-item", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isChecked ? <Check className="h-4 w-4" /> : null}
      </span>
      {children}
    </MenubarItem>
  )
}

interface MenubarRadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

function MenubarRadioGroup({
  value,
  onValueChange,
  children,
}: MenubarRadioGroupProps) {
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

interface MenubarRadioItemProps extends Omit<MenubarItemProps, "onSelect"> {
  value: string
  onSelect?: (event: Event) => void
}

function MenubarRadioItem({
  className,
  value,
  onSelect,
  children,
  ...rest
}: MenubarRadioItemProps) {
  const radio = React.useContext(RadioGroupContext)
  const checked = radio?.value === value
  return (
    <MenubarItem
      role="menuitemradio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onSelect={(event) => {
        onSelect?.(event)
        if ((event as Event & { defaultPrevented?: boolean }).defaultPrevented)
          return
        radio?.onValueChange?.(value)
      }}
      className={cn("dr-menubar-radio-item", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked ? <Circle className="h-2 w-2 fill-current" /> : null}
      </span>
      {children}
    </MenubarItem>
  )
}

interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function MenubarLabel({ className, inset, ref, ...rest }: MenubarLabelProps) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("dr-menubar-label", inset && "pl-8", className)}
      {...rest}
    />
  )
}

interface MenubarSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function MenubarSeparator({ className, ref, ...rest }: MenubarSeparatorProps) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cn("dr-menubar-separator", className)}
      {...rest}
    />
  )
}

function MenubarShortcut({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("dr-menubar-shortcut", className)} {...rest} />
}

interface MenubarSubProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function MenubarSub({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: MenubarSubProps) {
  const generatedId = useId()
  return (
    <MenubarMenuRoot
      menuId={generatedId}
      root={null}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isSubmenu
    >
      {children}
    </MenubarMenuRoot>
  )
}

interface MenubarSubTriggerProps extends Omit<MenubarItemProps, "onSelect"> {
  ref?: React.Ref<HTMLDivElement>
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  onPointerEnter,
  onClick,
  onKeyDown,
  ref,
  ...rest
}: MenubarSubTriggerProps) {
  const ctx = useMenubarMenu("MenubarSubTrigger")
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const setReference = ctx.setReference
  React.useEffect(() => {
    setReference(localRef.current)
  }, [setReference])

  return (
    <MenubarItem
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
        ;(event as Event & { preventDefault: () => void }).preventDefault?.()
      }}
      className={cn("dr-menubar-sub-trigger", inset && "pl-8", className)}
      {...rest}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarItem>
  )
}

type MenubarSubContentProps = MenubarContentProps

function MenubarSubContent({
  className,
  side = "right",
  align = "start",
  sideOffset = 0,
  ...rest
}: MenubarSubContentProps) {
  return (
    <MenubarContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn("dr-menubar-sub-content", className)}
      {...rest}
    />
  )
}

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
