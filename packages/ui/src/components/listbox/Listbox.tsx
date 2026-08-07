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
 * How a selected item is painted. `filled` is a solid primary surface;
 * `outline` keeps the surface transparent and marks selection with a 1px
 * primary ring, for denser lists where a run of solid fills is heavy.
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
  const ctx = useListbox({ mode, value, defaultValue, onValueChange })
  const focusedItem = ctx.items()[ctx.focusedIndex]
  return (
    <ListboxContext.Provider value={ctx}>
      <div
        role="listbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiselectable={ctx.mode === "multi" || undefined}
        aria-activedescendant={focusedItem?.id}
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
  ...rest
}: ListboxItemProps) {
  const ctx = useListboxContext("ListboxItem")
  const id = useId()
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const descriptorRef = React.useRef({
    id,
    value,
    disabled,
    textValue: textValue ?? "",
  })

  // Keep descriptor fields fresh.
  descriptorRef.current.id = id
  descriptorRef.current.disabled = disabled
  descriptorRef.current.value = value
  if (textValue !== undefined) descriptorRef.current.textValue = textValue

  React.useEffect(() => {
    return ctx.registerItem(descriptorRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pick up DOM textContent as fallback for typeahead.
  React.useEffect(() => {
    if (textValue !== undefined) return
    descriptorRef.current.textValue = localRef.current?.textContent ?? ""
  })

  const items = ctx.items()
  const myIndex = items.findIndex((d) => d === descriptorRef.current)
  const isFocused = myIndex >= 0 && ctx.focusedIndex === myIndex
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
      onPointerEnter={() => {
        if (myIndex >= 0 && !disabled) ctx.setFocusedIndex(myIndex)
      }}
      className={cn("dr-listbox-item", className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export { Listbox, ListboxItem }
