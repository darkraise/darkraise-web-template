import * as React from "react"
import { cn } from "@lib/utils"
import { useId } from "@primitives/state"
import {
  useListbox,
  type ListboxMode,
  type UseListboxReturn,
} from "./useListbox"
import "./listbox.css"

const ListboxContext = React.createContext<UseListboxReturn | null>(null)

function useListboxContext(consumer: string): UseListboxReturn {
  const ctx = React.useContext(ListboxContext)
  if (!ctx) throw new Error(`${consumer} must be used inside <Listbox>`)
  return ctx
}

/**
 * How a selected item is painted. `filled` paints the checked fill;
 * `outline` draws a 1px accent ring over a transparent row.
 */
export type ListboxVariant = "filled" | "outline"

export interface ListboxProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  mode?: ListboxMode
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  disabled?: boolean
  /** @default "filled" */
  variant?: ListboxVariant
}

function Listbox({
  className,
  mode,
  value,
  defaultValue,
  onValueChange,
  disabled,
  variant = "filled",
  children,
  ...rest
}: ListboxProps) {
  const ctx = useListbox({
    mode,
    value,
    defaultValue,
    onValueChange,
    disabled,
  })
  return (
    <ListboxContext.Provider value={ctx}>
      <div
        role="listbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiselectable={ctx.mode === "multi" || undefined}
        aria-activedescendant={ctx.focusedId ?? undefined}
        aria-disabled={disabled || undefined}
        data-disabled={disabled || undefined}
        data-variant={variant}
        className={cn("dr-listbox", className)}
        onKeyDown={disabled ? undefined : ctx.handleKeyDown}
        {...rest}
      >
        {children}
      </div>
    </ListboxContext.Provider>
  )
}

export interface ListboxItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  value: string
  disabled?: boolean
  textValue?: string
}

function ListboxItem({
  className,
  value,
  disabled = false,
  textValue,
  children,
  onClick,
  onPointerEnter,
  ...rest
}: ListboxItemProps) {
  const ctx = useListboxContext("ListboxItem")
  const { registerItem, unregisterItem } = ctx
  const id = useId()
  const localRef = React.useRef<HTMLDivElement | null>(null)

  // Unregistering is its own effect so a field change replaces the record in
  // place instead of removing the item, which would move focus off it.
  React.useLayoutEffect(() => () => unregisterItem(id), [unregisterItem, id])

  // `children` is a dependency because, without `textValue`, typeahead
  // matches the rendered text.
  React.useLayoutEffect(() => {
    registerItem({
      id,
      value,
      disabled,
      textValue: textValue ?? localRef.current?.textContent ?? "",
      element: localRef.current,
    })
  }, [registerItem, id, value, disabled, textValue, children])

  const isFocused = ctx.focusedId === id
  const selected = ctx.isSelected(value)

  return (
    <div
      ref={localRef}
      id={id}
      role="option"
      aria-selected={selected ? "true" : "false"}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-focused={isFocused ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.toggle(value)
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (!disabled && !ctx.disabled) ctx.setFocusedId(id)
      }}
      className={cn("dr-listbox-item", className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export { Listbox, ListboxItem }
