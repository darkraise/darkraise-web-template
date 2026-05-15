"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import { DismissableLayer } from "@primitives/dismissable-layer"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { Slot, composeRefs } from "@primitives/slot"
import { useFloating } from "@primitives/floating"
import { useControllableState } from "@primitives/state"
import { useMenu } from "@components/_internal/useMenu"
import "./select.css"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"
type Position = "item-aligned" | "popper"

interface SelectItemRecord {
  value: string
  textValue: string
  disabled: boolean
  ref: React.RefObject<HTMLDivElement | null>
}

interface SelectContextValue {
  open: boolean
  setOpen: (next: boolean) => void
  value: string
  setValue: (next: string) => void
  triggerId: string
  contentId: string
  /** Trigger anchor for floating positioning. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
  registerItem: (item: SelectItemRecord) => () => void
  items: () => SelectItemRecord[]
  focusedIndex: number
  setFocusedIndex: (next: number) => void
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrev: () => void
  typeahead: (char: string) => number
  /** Selected item label (cached) */
  selectedLabel: string | null
  /** Disabled flag from root */
  disabled: boolean
  required: boolean
  name?: string
  form?: string
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(consumer: string): SelectContextValue {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Select>`)
  return ctx
}

interface SelectProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  name?: string
  form?: string
  dir?: "ltr" | "rtl"
  children?: React.ReactNode
}

function Select({
  open: openProp,
  defaultOpen,
  onOpenChange,
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled = false,
  required = false,
  name,
  form,
  children,
}: SelectProps) {
  const menu = useMenu({ open: openProp, defaultOpen, onOpenChange })
  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  })
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const [selectedLabel, setSelectedLabel] = React.useState<string | null>(null)

  const setValueAndClose = React.useCallback(
    (next: string) => {
      setValue(next)
      menu.setOpen(false)
    },
    [setValue, menu],
  )

  const ctx = React.useMemo<SelectContextValue>(
    () => ({
      open: menu.open,
      setOpen: menu.setOpen,
      value,
      setValue: setValueAndClose,
      triggerId: menu.triggerId,
      contentId: menu.contentId,
      triggerRef,
      registerItem: menu.registerItem as unknown as (
        item: SelectItemRecord,
      ) => () => void,
      items: menu.items as unknown as () => SelectItemRecord[],
      focusedIndex: menu.focusedIndex,
      setFocusedIndex: menu.setFocusedIndex,
      focusFirst: menu.focusFirst,
      focusLast: menu.focusLast,
      focusNext: menu.focusNext,
      focusPrev: menu.focusPrev,
      typeahead: menu.typeahead,
      selectedLabel,
      disabled,
      required,
      name,
      form,
    }),
    [
      menu,
      value,
      setValueAndClose,
      selectedLabel,
      disabled,
      required,
      name,
      form,
    ],
  )

  // Wire selectedLabel: track an item with matching value.
  const itemsAccessor = menu.items
  React.useEffect(() => {
    if (!value) {
      setSelectedLabel(null)
      return
    }
    const list = itemsAccessor()
    const matched = list.find((it) => it.value === value)
    setSelectedLabel(matched?.textValue ?? null)
  }, [value, itemsAccessor, menu.open])

  return (
    <SelectContext.Provider value={ctx}>
      {children}
      {name ? (
        <select
          aria-hidden
          tabIndex={-1}
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          value={value}
          onChange={() => {}}
          style={{
            position: "absolute",
            border: 0,
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            wordWrap: "normal",
          }}
        >
          {value ? <option value={value}>{value}</option> : null}
        </select>
      ) : null}
    </SelectContext.Provider>
  )
}

interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}
function SelectGroup({ ref, ...rest }: SelectGroupProps) {
  return <div ref={ref} role="group" {...rest} />
}

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: React.ReactNode
  children?: React.ReactNode
  ref?: React.Ref<HTMLSpanElement>
}

function SelectValue({
  placeholder,
  children,
  className,
  ref,
  ...rest
}: SelectValueProps) {
  const ctx = useSelectContext("SelectValue")
  const hasValue = ctx.value !== "" && ctx.value !== undefined
  return (
    <span
      ref={ref}
      data-placeholder={!hasValue ? "" : undefined}
      className={cn(className)}
      {...rest}
    >
      {hasValue
        ? (children ?? ctx.selectedLabel ?? ctx.value)
        : (placeholder ?? null)}
    </span>
  )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function SelectTrigger({
  className,
  children,
  asChild,
  type,
  onClick,
  onPointerDown,
  onKeyDown,
  ref,
  disabled: disabledProp,
  ...rest
}: SelectTriggerProps) {
  const ctx = useSelectContext("SelectTrigger")
  const Comp = asChild ? Slot : "button"
  const resolvedType = asChild ? type : (type ?? "button")
  const disabled = disabledProp ?? ctx.disabled
  return (
    <Comp
      ref={composeRefs(ctx.triggerRef as React.Ref<HTMLButtonElement>, ref)}
      type={resolvedType}
      role="combobox"
      id={ctx.triggerId}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      aria-controls={ctx.open ? ctx.contentId : undefined}
      aria-required={ctx.required || undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      data-state={ctx.open ? "open" : "closed"}
      data-placeholder={
        ctx.value === "" || ctx.value === undefined ? "" : undefined
      }
      data-disabled={disabled || undefined}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.setOpen(!ctx.open)
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        if (
          event.key === "ArrowDown" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault()
          if (!ctx.open) ctx.setOpen(true)
          requestAnimationFrame(() => ctx.focusFirst())
        } else if (event.key === "ArrowUp") {
          event.preventDefault()
          if (!ctx.open) ctx.setOpen(true)
          requestAnimationFrame(() => ctx.focusLast())
        }
      }}
      className={cn("dr-select-trigger", className)}
      {...rest}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
    </Comp>
  )
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: Position
  side?: Side
  align?: Align
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  forceMount?: boolean
  onCloseAutoFocus?: (event: Event) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
  ref?: React.Ref<HTMLDivElement>
}

function placementOf(side: Side, align: Align) {
  return align === "center" ? side : (`${side}-${align}` as const)
}

function SelectContentImpl({
  className,
  children,
  position = "popper",
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignOffset = 0,
  collisionPadding = 8,
  avoidCollisions = true,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  ref,
  ...rest
}: Omit<SelectContentProps, "forceMount">) {
  const ctx = useSelectContext("SelectContent")

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
    setReferenceFloat(ctx.triggerRef.current ?? null)
  }, [ctx.triggerRef, setReferenceFloat])

  const localContentRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ctx.open) return
    queueMicrotask(() => {
      localContentRef.current?.focus({ preventScroll: true })
    })
  }, [ctx.open])

  const onCloseAutoFocusRef = React.useRef(onCloseAutoFocus)
  React.useEffect(() => {
    onCloseAutoFocusRef.current = onCloseAutoFocus
  })

  React.useEffect(() => {
    return () => {
      const event = new Event("closeAutoFocus", { cancelable: true })
      onCloseAutoFocusRef.current?.(event)
      if (event.defaultPrevented) return
      ctx.triggerRef.current?.focus({ preventScroll: true })
    }
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
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const list = ctx.items()
      const item = list[ctx.focusedIndex]
      if (item && !item.disabled) {
        ctx.setValue(item.value)
      }
    } else if (event.key === "Tab") {
      event.preventDefault()
      ctx.setOpen(false)
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
        if (event.defaultPrevented) return
        if (
          event.target instanceof Node &&
          ctx.triggerRef.current?.contains(event.target)
        )
          return
        ctx.setOpen(false)
      }}
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.setOpen(false)
      }}
    >
      <div
        ref={composeRefs(
          localContentRef,
          floating.refs.setFloating as React.Ref<HTMLDivElement>,
          ref,
        )}
        role="listbox"
        id={ctx.contentId}
        data-state={ctx.open ? "open" : "closed"}
        data-side={resolvedSide}
        data-position={position}
        tabIndex={-1}
        style={{
          position: floating.strategy,
          top: floating.y ?? 0,
          left: floating.x ?? 0,
        }}
        className={cn("dr-select-content", className)}
        {...rest}
        onKeyDown={(event) => {
          rest.onKeyDown?.(event)
          if (event.defaultPrevented) return
          handleKeyDown(event)
        }}
      >
        <div data-position={position} className="dr-select-viewport">
          {children}
        </div>
      </div>
    </DismissableLayer>
  )
}

function SelectContent({ forceMount, ...props }: SelectContentProps) {
  const ctx = useSelectContext("SelectContent")
  return (
    <Portal>
      <Presence present={ctx.open} forceMount={forceMount}>
        <SelectContentImpl {...props} />
      </Presence>
    </Portal>
  )
}

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function SelectLabel({ className, ref, ...rest }: SelectLabelProps) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn("dr-select-label", className)}
      {...rest}
    />
  )
}

interface SelectItemContextValue {
  selected: boolean
  textValue: string
}

const SelectItemContext = React.createContext<SelectItemContextValue | null>(
  null,
)

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  disabled?: boolean
  textValue?: string
  ref?: React.Ref<HTMLDivElement>
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  textValue,
  onClick,
  onPointerEnter,
  ref,
  ...rest
}: SelectItemProps) {
  const ctx = useSelectContext("SelectItem")
  const localRef = React.useRef<HTMLDivElement | null>(null)

  const recordRef = React.useRef<SelectItemRecord | null>(null)
  if (recordRef.current === null) {
    recordRef.current = {
      value,
      textValue: textValue ?? "",
      disabled: !!disabled,
      ref: localRef,
    }
  }
  if (recordRef.current) {
    recordRef.current.value = value
    recordRef.current.disabled = !!disabled
    if (textValue !== undefined) recordRef.current.textValue = textValue
  }

  const registerItem = ctx.registerItem
  React.useEffect(() => {
    const rec = recordRef.current
    if (!rec) return
    return registerItem(rec)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (textValue !== undefined) return
    const node = localRef.current
    const rec = recordRef.current
    if (node && rec) rec.textValue = node.textContent ?? ""
  })

  const list = ctx.items()
  const myIndex = list.findIndex((it) => it === recordRef.current)
  const isFocused = myIndex >= 0 && ctx.focusedIndex === myIndex
  const selected = ctx.value === value

  React.useEffect(() => {
    if (isFocused) localRef.current?.focus({ preventScroll: true })
  }, [isFocused])

  const itemCtx = React.useMemo<SelectItemContextValue>(
    () => ({ selected, textValue: textValue ?? "" }),
    [selected, textValue],
  )

  return (
    <div
      ref={composeRefs(localRef, ref)}
      role="option"
      tabIndex={isFocused ? 0 : -1}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-state={selected ? "checked" : "unchecked"}
      data-disabled={disabled || undefined}
      data-highlighted={isFocused ? "" : undefined}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (disabled) return
        if (myIndex >= 0) ctx.setFocusedIndex(myIndex)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.setValue(value)
      }}
      className={cn("dr-select-item", className)}
      {...rest}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {selected ? <Check className="h-4 w-4" /> : null}
      </span>
      <SelectItemContext.Provider value={itemCtx}>
        <SelectItemText>{children}</SelectItemText>
      </SelectItemContext.Provider>
    </div>
  )
}

interface SelectItemTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>
}

function SelectItemText({ className, ref, ...rest }: SelectItemTextProps) {
  return <span ref={ref} className={cn(className)} {...rest} />
}

interface SelectSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function SelectSeparator({ className, ref, ...rest }: SelectSeparatorProps) {
  return (
    <div
      ref={ref}
      role="separator"
      className={cn("dr-select-separator", className)}
      {...rest}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
