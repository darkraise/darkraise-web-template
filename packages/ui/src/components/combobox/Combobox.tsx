"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { useClickOutside } from "../../hooks/useClickOutside"
import {
  type ComboboxInputValueChangeDetails,
  type ComboboxItemData,
  type ComboboxValueChangeDetails,
  type UseComboboxOptions,
  type UseComboboxReturn,
  useCombobox,
} from "./useCombobox"
import "./combobox.css"

export type {
  ComboboxItemData,
  ComboboxInputValueChangeDetails,
  ComboboxValueChangeDetails,
}

interface ComboboxContextValue extends UseComboboxReturn {
  rootRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  contentId: string
  name?: string
  placeholder?: string
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

function useComboboxContext(part: string): ComboboxContextValue {
  const ctx = React.useContext(ComboboxContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <Combobox> root component`)
  }
  return ctx
}

export interface ComboboxProps
  extends
    Omit<UseComboboxOptions, "items">,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  items: ComboboxItemData[]
  name?: string
  placeholder?: string
  children?: React.ReactNode
}

function Combobox({
  className,
  items,
  inputValue,
  defaultInputValue,
  value,
  defaultValue,
  multiple,
  open,
  defaultOpen,
  openOnClick,
  closeOnSelect,
  loopFocus,
  disabled,
  onInputValueChange,
  onValueChange,
  onOpenChange,
  name,
  placeholder,
  children,
  ...rest
}: ComboboxProps) {
  const state = useCombobox({
    items,
    inputValue,
    defaultInputValue,
    value,
    defaultValue,
    multiple,
    open,
    defaultOpen,
    openOnClick,
    closeOnSelect,
    loopFocus,
    disabled,
    onInputValueChange,
    onValueChange,
    onOpenChange,
  })

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const contentId = `${state.baseId}-content`

  useClickOutside(rootRef, () => {
    if (state.open) state.setOpen(false)
  })

  const ctx = React.useMemo<ComboboxContextValue>(
    () => ({
      ...state,
      rootRef,
      inputRef,
      contentId,
      name,
      placeholder,
    }),
    [state, contentId, name, placeholder],
  )

  return (
    <div
      ref={rootRef}
      className={cn("dr-combobox", className)}
      data-state={state.open ? "open" : "closed"}
      data-disabled={state.disabled ? "true" : undefined}
      {...rest}
    >
      <ComboboxContext.Provider value={ctx}>
        {children}
        {name ? (
          <input
            type="hidden"
            name={name}
            value={
              state.multiple
                ? state.selectedValues.join(",")
                : (state.selectedValues[0] ?? "")
            }
          />
        ) : null}
      </ComboboxContext.Provider>
    </div>
  )
}

export type ComboboxLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

function ComboboxLabel({ className, ...props }: ComboboxLabelProps) {
  const { labelId, inputId } = useComboboxContext("ComboboxLabel")
  return (
    <label
      id={labelId}
      htmlFor={inputId}
      className={cn("dr-combobox-label", className)}
      {...props}
    />
  )
}

export type ComboboxControlProps = React.HTMLAttributes<HTMLDivElement>

function ComboboxControl({ className, ...props }: ComboboxControlProps) {
  const { open, disabled } = useComboboxContext("ComboboxControl")
  return (
    <div
      className={cn("dr-combobox-control", className)}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "true" : undefined}
      {...props}
    />
  )
}

export interface ComboboxInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  ref?: React.Ref<HTMLInputElement>
}

function ComboboxInput({
  className,
  onChange,
  onFocus,
  onClick,
  onKeyDown,
  onBlur,
  ref,
  placeholder: placeholderProp,
  ...props
}: ComboboxInputProps) {
  const ctx = useComboboxContext("ComboboxInput")
  const {
    inputValue,
    items,
    open,
    setOpen,
    setInputValue,
    setHighlightedIndex,
    selectItem,
    highlightedIndex,
    inputId,
    listId,
    labelId,
    getItemId,
    inputRef,
    multiple,
    disabled,
    loopFocus,
    openOnClick,
    selectedValues,
    placeholder,
  } = ctx

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [inputRef, ref],
  )

  const enabledIndices = React.useMemo(
    () => items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i !== -1),
    [items],
  )

  const moveHighlight = (direction: 1 | -1) => {
    if (enabledIndices.length === 0) return
    const currentPos = enabledIndices.indexOf(highlightedIndex)
    if (currentPos === -1) {
      const nextIdx =
        direction === 1
          ? enabledIndices[0]
          : enabledIndices[enabledIndices.length - 1]
      if (nextIdx !== undefined) setHighlightedIndex(nextIdx)
      return
    }
    let nextPos = currentPos + direction
    if (nextPos < 0) {
      nextPos = loopFocus ? enabledIndices.length - 1 : 0
    } else if (nextPos >= enabledIndices.length) {
      nextPos = loopFocus ? 0 : enabledIndices.length - 1
    }
    const nextIdx = enabledIndices[nextPos]
    if (nextIdx !== undefined) setHighlightedIndex(nextIdx)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    setInputValue(event.target.value)
    if (!open) setOpen(true)
    if (items.length > 0) setHighlightedIndex(0)
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event)
    if (event.defaultPrevented) return
    if (!open) setOpen(true)
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (openOnClick && !open) setOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (disabled) return

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          if (enabledIndices.length > 0) {
            const first = enabledIndices[0]
            if (first !== undefined) setHighlightedIndex(first)
          }
          return
        }
        moveHighlight(1)
        return
      }
      case "ArrowUp": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          if (enabledIndices.length > 0) {
            const last = enabledIndices[enabledIndices.length - 1]
            if (last !== undefined) setHighlightedIndex(last)
          }
          return
        }
        moveHighlight(-1)
        return
      }
      case "Home": {
        if (!open) return
        event.preventDefault()
        const first = enabledIndices[0]
        if (first !== undefined) setHighlightedIndex(first)
        return
      }
      case "End": {
        if (!open) return
        event.preventDefault()
        const last = enabledIndices[enabledIndices.length - 1]
        if (last !== undefined) setHighlightedIndex(last)
        return
      }
      case "Enter": {
        if (!open) return
        if (highlightedIndex < 0 || highlightedIndex >= items.length) {
          event.preventDefault()
          setOpen(false)
          return
        }
        const item = items[highlightedIndex]
        if (!item) return
        event.preventDefault()
        selectItem(item)
        return
      }
      case "Escape": {
        if (!open) return
        event.preventDefault()
        setOpen(false)
        return
      }
      case "Tab": {
        if (!open) return
        if (
          !multiple &&
          highlightedIndex >= 0 &&
          highlightedIndex < items.length
        ) {
          const item = items[highlightedIndex]
          if (item && !item.disabled && !selectedValues.includes(item.value)) {
            selectItem(item)
            return
          }
        }
        setOpen(false)
        return
      }
      default:
        return
    }
  }

  const activeDescendant =
    open && highlightedIndex >= 0 && highlightedIndex < items.length
      ? getItemId(highlightedIndex)
      : undefined

  return (
    <input
      ref={setRef}
      id={inputId}
      type="text"
      role="combobox"
      autoComplete="off"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={activeDescendant}
      aria-labelledby={labelId}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      value={inputValue}
      placeholder={placeholderProp ?? placeholder}
      data-state={open ? "open" : "closed"}
      className={cn("dr-input", "dr-combobox-input", className)}
      onChange={handleChange}
      onFocus={handleFocus}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
      {...props}
    />
  )
}

export interface ComboboxClearTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ComboboxClearTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  ...props
}: ComboboxClearTriggerProps) {
  const { inputValue, selectedValues, clearAll, inputRef, multiple, disabled } =
    useComboboxContext("ComboboxClearTrigger")

  const isEmpty =
    inputValue.length === 0 && (multiple || selectedValues.length === 0)
  if (isEmpty) return null

  return (
    <button
      ref={ref}
      type={type}
      tabIndex={-1}
      aria-label="Clear"
      disabled={disabled}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-combobox-clear-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        clearAll()
        inputRef.current?.focus()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface ComboboxTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ComboboxTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  ...props
}: ComboboxTriggerProps) {
  const { open, setOpen, inputRef, disabled, listId, labelId } =
    useComboboxContext("ComboboxTrigger")

  return (
    <button
      ref={ref}
      type={type}
      tabIndex={-1}
      aria-label="Toggle"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      aria-labelledby={labelId}
      disabled={disabled}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-combobox-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setOpen(!open)
        inputRef.current?.focus()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export type ComboboxContentProps = React.HTMLAttributes<HTMLDivElement>

function ComboboxContent({
  className,
  children,
  ...props
}: ComboboxContentProps) {
  const { open, contentId } = useComboboxContext("ComboboxContent")
  if (!open) return null
  return (
    <div
      id={contentId}
      data-state="open"
      className={cn("dr-combobox-content", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type ComboboxListProps = React.HTMLAttributes<HTMLUListElement>

function ComboboxList({ className, ...props }: ComboboxListProps) {
  const { listId, labelId } = useComboboxContext("ComboboxList")
  return (
    <ul
      id={listId}
      role="listbox"
      aria-labelledby={labelId}
      className={cn("dr-combobox-list", className)}
      {...props}
    />
  )
}

interface ComboboxItemContextValue {
  index: number
  item: ComboboxItemData
  selected: boolean
  highlighted: boolean
  itemDisabled: boolean
}

const ComboboxItemContext =
  React.createContext<ComboboxItemContextValue | null>(null)

function useComboboxItemContext(part: string): ComboboxItemContextValue {
  const ctx = React.useContext(ComboboxItemContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <ComboboxItem>`)
  }
  return ctx
}

export interface ComboboxItemProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "onSelect"
> {
  item: ComboboxItemData
}

function ComboboxItem({
  className,
  item,
  onClick,
  onMouseMove,
  children,
  ...props
}: ComboboxItemProps) {
  const {
    items,
    isSelected,
    highlightedIndex,
    setHighlightedIndex,
    selectItem,
    getItemId,
  } = useComboboxContext("ComboboxItem")

  const index = React.useMemo(
    () => items.findIndex((it) => it.value === item.value),
    [items, item.value],
  )

  const selected = isSelected(item.value)
  const highlighted = highlightedIndex === index
  const itemDisabled = !!item.disabled

  const itemCtx = React.useMemo<ComboboxItemContextValue>(
    () => ({ index, item, selected, highlighted, itemDisabled }),
    [index, item, selected, highlighted, itemDisabled],
  )

  if (index === -1) return null

  return (
    <li
      id={getItemId(index)}
      role="option"
      aria-selected={selected}
      aria-disabled={itemDisabled || undefined}
      data-state={selected ? "checked" : "unchecked"}
      data-highlighted={highlighted ? "true" : "false"}
      data-disabled={itemDisabled ? "true" : undefined}
      data-value={item.value}
      className={cn("dr-combobox-item", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (itemDisabled) return
        selectItem(item)
      }}
      onMouseMove={(event) => {
        onMouseMove?.(event)
        if (event.defaultPrevented) return
        if (itemDisabled) return
        if (highlightedIndex !== index) setHighlightedIndex(index)
      }}
      {...props}
    >
      <ComboboxItemContext.Provider value={itemCtx}>
        {children}
      </ComboboxItemContext.Provider>
    </li>
  )
}

export type ComboboxItemTextProps = React.HTMLAttributes<HTMLSpanElement>

function ComboboxItemText({ className, ...props }: ComboboxItemTextProps) {
  return <span className={cn("dr-combobox-item-text", className)} {...props} />
}

export type ComboboxItemIndicatorProps = React.HTMLAttributes<HTMLSpanElement>

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: ComboboxItemIndicatorProps) {
  const { selected } = useComboboxItemContext("ComboboxItemIndicator")
  return (
    <span
      aria-hidden="true"
      data-state={selected ? "checked" : "unchecked"}
      className={cn("dr-combobox-item-indicator", className)}
      {...props}
    >
      {selected ? children : null}
    </span>
  )
}

export type ComboboxEmptyProps = React.HTMLAttributes<HTMLDivElement>

function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  const { items } = useComboboxContext("ComboboxEmpty")
  if (items.length > 0) return null
  return (
    <div
      role="presentation"
      className={cn("dr-combobox-empty", className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxLabel,
  ComboboxControl,
  ComboboxInput,
  ComboboxClearTrigger,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxItemText,
  ComboboxItemIndicator,
  ComboboxEmpty,
}
