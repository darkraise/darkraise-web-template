import * as React from "react"
import { useControllableState } from "@primitives/state"

export type ListboxMode = "single" | "multi"

export interface ListboxItemDescriptor {
  value: string
  disabled: boolean
  textValue: string
}

export interface UseListboxOptions {
  mode?: ListboxMode
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

export interface UseListboxReturn {
  mode: ListboxMode
  value: string | string[] | undefined
  isSelected: (val: string) => boolean
  toggle: (val: string) => void
  focusedIndex: number
  setFocusedIndex: (i: number) => void
  registerItem: (descriptor: ListboxItemDescriptor) => () => void
  items: () => ListboxItemDescriptor[]
  handleKeyDown: (event: React.KeyboardEvent) => void
  typeahead: (char: string) => void
}

export function useListbox(options: UseListboxOptions): UseListboxReturn {
  const mode = options.mode ?? "single"
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
  const items = React.useCallback(() => itemsRef.current, [])

  const registerItem = React.useCallback(
    (descriptor: ListboxItemDescriptor) => {
      itemsRef.current = [...itemsRef.current, descriptor]
      return () => {
        itemsRef.current = itemsRef.current.filter((i) => i !== descriptor)
      }
    },
    [],
  )

  const isSelected = (val: string) => {
    if (value === undefined) return false
    return Array.isArray(value) ? value.includes(val) : value === val
  }

  const toggle = (val: string) => {
    const target = itemsRef.current.find((i) => i.value === val)
    if (!target || target.disabled) return
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

  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  const enabledIndexes = () =>
    itemsRef.current
      .map((it, idx) => (it.disabled ? -1 : idx))
      .filter((i) => i >= 0)

  const moveFocus = (direction: 1 | -1) => {
    const enabled = enabledIndexes()
    if (enabled.length === 0) return
    const cur = enabled.indexOf(focusedIndex)
    const nextIdx =
      cur < 0
        ? direction === 1
          ? enabled[0]
          : enabled[enabled.length - 1]
        : enabled[(cur + direction + enabled.length) % enabled.length]
    if (nextIdx !== undefined) setFocusedIndex(nextIdx)
  }

  const focusFirst = () => {
    const enabled = enabledIndexes()
    const first = enabled[0]
    if (first !== undefined) setFocusedIndex(first)
  }
  const focusLast = () => {
    const enabled = enabledIndexes()
    const last = enabled[enabled.length - 1]
    if (last !== undefined) setFocusedIndex(last)
  }

  const typeaheadBufferRef = React.useRef("")
  const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const typeahead = (char: string) => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
    typeaheadBufferRef.current += char.toLowerCase()
    const needle = typeaheadBufferRef.current
    const match = itemsRef.current.findIndex(
      (i) => !i.disabled && i.textValue.toLowerCase().startsWith(needle),
    )
    if (match >= 0) setFocusedIndex(match)
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
      const item = itemsRef.current[focusedIndex]
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
    isSelected,
    toggle,
    focusedIndex,
    setFocusedIndex,
    registerItem,
    items,
    handleKeyDown,
    typeahead,
  }
}
