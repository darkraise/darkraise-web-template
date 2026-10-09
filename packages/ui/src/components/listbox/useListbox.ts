import * as React from "react"
import { useControllableState } from "@primitives/state"

export type ListboxMode = "single" | "multi"

export interface ListboxItemDescriptor {
  id: string
  value: string
  disabled: boolean
  textValue: string
}

export interface UseListboxOptions {
  mode?: ListboxMode
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  disabled?: boolean
}

export interface UseListboxReturn {
  mode: ListboxMode
  value: string | string[] | undefined
  disabled: boolean
  isSelected: (val: string) => boolean
  toggle: (val: string) => void
  focusedId: string | null
  setFocusedId: (id: string | null) => void
  registerItem: (descriptor: ListboxItemDescriptor) => () => void
  items: () => ListboxItemDescriptor[]
  handleKeyDown: (event: React.KeyboardEvent) => void
  typeahead: (char: string) => void
}

export function useListbox(options: UseListboxOptions): UseListboxReturn {
  const mode = options.mode ?? "single"
  const disabled = options.disabled ?? false
  const [value, setValue] = useControllableState<string | string[] | undefined>(
    {
      value: options.value,
      defaultValue: options.defaultValue ?? (mode === "multi" ? [] : undefined),
      onChange: options.onValueChange as (
        next: string | string[] | undefined,
      ) => void,
    },
  )

  const itemsRef = React.useRef<ListboxItemDescriptor[]>([])
  // An item's effect cleanup runs before it re-registers with changed fields,
  // so removing it at once would move it to the end of the order. Removal
  // waits for the next read instead, and re-registering the id cancels it.
  const removedIdsRef = React.useRef(new Set<string>())

  const items = React.useCallback(() => {
    const removed = removedIdsRef.current
    if (removed.size > 0) {
      itemsRef.current = itemsRef.current.filter((i) => !removed.has(i.id))
      removed.clear()
    }
    return itemsRef.current
  }, [])

  const registerItem = React.useCallback(
    (descriptor: ListboxItemDescriptor) => {
      removedIdsRef.current.delete(descriptor.id)
      const list = itemsRef.current
      const at = list.findIndex((i) => i.id === descriptor.id)
      itemsRef.current =
        at === -1
          ? [...list, descriptor]
          : list.map((i, n) => (n === at ? descriptor : i))
      return () => {
        removedIdsRef.current.add(descriptor.id)
      }
    },
    [],
  )

  const isSelected = (val: string) => {
    if (value === undefined) return false
    return Array.isArray(value) ? value.includes(val) : value === val
  }

  const toggle = (val: string) => {
    const target = items().find((i) => i.value === val)
    if (disabled || !target || target.disabled) return
    if (mode === "multi") {
      const cur = (value as string[] | undefined) ?? []
      const next = cur.includes(val)
        ? cur.filter((v) => v !== val)
        : [...cur, val]
      setValue(next)
    } else {
      setValue(val)
    }
  }

  // The focused item's position is kept beside its id: when that item is
  // removed, the arrow keys continue from the item that took its position.
  const [focus, setFocus] = React.useState<{
    id: string | null
    index: number
  }>({ id: null, index: -1 })
  const focusedId = focus.id

  const setFocusedId = (id: string | null) => {
    setFocus({
      id,
      index: id === null ? -1 : items().findIndex((i) => i.id === id),
    })
  }

  const enabledItems = () => items().filter((it) => !it.disabled)

  const moveFocus = (direction: 1 | -1) => {
    const list = items()
    const enabled = list.flatMap((it, n) => (it.disabled ? [] : [n]))
    if (enabled.length === 0) return
    const at = list.findIndex((it) => it.id === focus.id)
    const cur = enabled.indexOf(at === -1 ? focus.index : at)
    const next =
      cur < 0
        ? direction === 1
          ? enabled[0]
          : enabled[enabled.length - 1]
        : enabled[(cur + direction + enabled.length) % enabled.length]
    if (next === undefined) return
    const item = list[next]
    if (item) setFocus({ id: item.id, index: next })
  }

  const focusFirst = () => {
    const first = enabledItems()[0]
    if (first) setFocusedId(first.id)
  }
  const focusLast = () => {
    const enabled = enabledItems()
    const last = enabled[enabled.length - 1]
    if (last) setFocusedId(last.id)
  }

  const typeaheadBufferRef = React.useRef("")
  const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const typeahead = (char: string) => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
    typeaheadBufferRef.current += char.toLowerCase()
    const needle = typeaheadBufferRef.current
    const match = items().find(
      (i) => !i.disabled && i.textValue.toLowerCase().startsWith(needle),
    )
    if (match) setFocusedId(match.id)
    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadBufferRef.current = ""
    }, 500)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveFocus(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveFocus(-1)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusFirst()
    } else if (event.key === "End") {
      event.preventDefault()
      focusLast()
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const item = items().find((i) => i.id === focusedId)
      if (item) toggle(item.value)
    } else if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      typeahead(event.key)
    }
  }

  return {
    mode,
    value,
    disabled,
    isSelected,
    toggle,
    focusedId,
    setFocusedId,
    registerItem,
    items,
    handleKeyDown,
    typeahead,
  }
}
