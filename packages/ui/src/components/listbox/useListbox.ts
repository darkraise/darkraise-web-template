import * as React from "react"
import { useControllableState } from "@primitives/state"
import { compareNodeOrder } from "@components/_internal/useMenu"

export type ListboxMode = "single" | "multi"

export interface ListboxItemDescriptor {
  id: string
  value: string
  disabled: boolean
  textValue: string
  /** The item's node. While every record has one, `items()` follows document order. */
  element?: HTMLElement | null
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
  unregisterItem: (id: string) => void
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
  const [focusedId, setFocusedId] = React.useState<string | null>(null)

  const items = React.useCallback((): ListboxItemDescriptor[] => {
    const list = itemsRef.current
    if (list.some((it) => !it.element)) return list
    return [...list].sort((a, b) =>
      a.element && b.element ? compareNodeOrder(a.element, b.element) : 0,
    )
  }, [])

  // A focused item that leaves hands focus to the enabled item that takes its
  // position, so `aria-activedescendant` never names a removed node.
  const unregisterItem = React.useCallback(
    (id: string) => {
      const at = items().findIndex((i) => i.id === id)
      if (at === -1) return
      itemsRef.current = itemsRef.current.filter((i) => i.id !== id)
      const rest = items()
      const successor =
        rest.slice(at).find((i) => !i.disabled) ??
        [...rest].reverse().find((i) => !i.disabled)
      const nextId = successor?.id ?? null
      setFocusedId((current) => (current === id ? nextId : current))
    },
    [items],
  )

  const registerItem = React.useCallback(
    (descriptor: ListboxItemDescriptor) => {
      const list = itemsRef.current
      const at = list.findIndex((i) => i.id === descriptor.id)
      itemsRef.current =
        at === -1
          ? [...list, descriptor]
          : list.map((i, n) => (n === at ? descriptor : i))
      return () => unregisterItem(descriptor.id)
    },
    [unregisterItem],
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

  const enabledItems = () => items().filter((it) => !it.disabled)

  const moveFocus = (direction: 1 | -1) => {
    const enabled = enabledItems()
    if (enabled.length === 0) return
    const cur = enabled.findIndex((it) => it.id === focusedId)
    const next =
      cur < 0
        ? direction === 1
          ? enabled[0]
          : enabled[enabled.length - 1]
        : enabled[(cur + direction + enabled.length) % enabled.length]
    if (next) setFocusedId(next.id)
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

  React.useEffect(() => {
    return () => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
    }
  }, [])

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
    unregisterItem,
    items,
    handleKeyDown,
    typeahead,
  }
}
