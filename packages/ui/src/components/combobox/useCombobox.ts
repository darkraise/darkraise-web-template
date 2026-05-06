"use client"

import * as React from "react"

export interface ComboboxItemData {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxValueChangeDetails {
  value: string[]
  items: ComboboxItemData[]
}

export interface ComboboxInputValueChangeDetails {
  value: string
}

export interface UseComboboxOptions {
  items: ComboboxItemData[]
  inputValue?: string
  defaultInputValue?: string
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  multiple?: boolean
  open?: boolean
  defaultOpen?: boolean
  openOnClick?: boolean
  closeOnSelect?: boolean
  loopFocus?: boolean
  disabled?: boolean
  onInputValueChange?: (details: ComboboxInputValueChangeDetails) => void
  onValueChange?: (details: ComboboxValueChangeDetails) => void
  onOpenChange?: (open: boolean) => void
}

export interface UseComboboxReturn {
  items: ComboboxItemData[]
  inputValue: string
  selectedValues: string[]
  open: boolean
  highlightedIndex: number
  multiple: boolean
  disabled: boolean
  closeOnSelect: boolean
  loopFocus: boolean
  openOnClick: boolean
  baseId: string
  listId: string
  inputId: string
  labelId: string
  getItemId: (index: number) => string
  setOpen: (next: boolean) => void
  setInputValue: (next: string) => void
  setHighlightedIndex: (index: number) => void
  selectItem: (item: ComboboxItemData) => void
  isSelected: (value: string) => boolean
  clearAll: () => void
}

function toArray(
  value: string | string[] | null | undefined,
  multiple: boolean,
): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return multiple ? value : value.slice(0, 1)
  return [value]
}

export function useCombobox(options: UseComboboxOptions): UseComboboxReturn {
  const {
    items,
    inputValue: inputValueProp,
    defaultInputValue = "",
    value: valueProp,
    defaultValue,
    multiple = false,
    open: openProp,
    defaultOpen = false,
    openOnClick = true,
    closeOnSelect: closeOnSelectProp,
    loopFocus = true,
    disabled = false,
    onInputValueChange,
    onValueChange,
    onOpenChange,
  } = options

  const closeOnSelect =
    closeOnSelectProp !== undefined ? closeOnSelectProp : !multiple

  const baseId = React.useId()
  const listId = `${baseId}-list`
  const inputId = `${baseId}-input`
  const labelId = `${baseId}-label`

  const inputControlled = inputValueProp !== undefined
  const valueControlled = valueProp !== undefined
  const openControlled = openProp !== undefined

  const [internalInput, setInternalInput] =
    React.useState<string>(defaultInputValue)
  const [internalValues, setInternalValues] = React.useState<string[]>(() =>
    toArray(defaultValue, multiple),
  )
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
  const [highlightedIndex, setHighlightedIndexState] =
    React.useState<number>(-1)

  const inputValue = inputControlled
    ? (inputValueProp as string)
    : internalInput
  const selectedValues = valueControlled
    ? toArray(valueProp, multiple)
    : internalValues
  const open = openControlled ? (openProp as boolean) : internalOpen

  const onInputValueChangeRef = React.useRef(onInputValueChange)
  const onValueChangeRef = React.useRef(onValueChange)
  const onOpenChangeRef = React.useRef(onOpenChange)
  React.useEffect(() => {
    onInputValueChangeRef.current = onInputValueChange
    onValueChangeRef.current = onValueChange
    onOpenChangeRef.current = onOpenChange
  })

  const setInputValue = React.useCallback(
    (next: string) => {
      if (!inputControlled) setInternalInput(next)
      onInputValueChangeRef.current?.({ value: next })
    },
    [inputControlled],
  )

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (next === open) return
      if (!openControlled) setInternalOpen(next)
      onOpenChangeRef.current?.(next)
    },
    [open, openControlled],
  )

  const setHighlightedIndex = React.useCallback((index: number) => {
    setHighlightedIndexState(index)
  }, [])

  const itemsRef = React.useRef(items)
  React.useEffect(() => {
    itemsRef.current = items
  }, [items])

  const commitValues = React.useCallback(
    (nextValues: string[]) => {
      if (!valueControlled) setInternalValues(nextValues)
      const set = new Set(nextValues)
      const matchedItems = itemsRef.current.filter((it) => set.has(it.value))
      onValueChangeRef.current?.({ value: nextValues, items: matchedItems })
    },
    [valueControlled],
  )

  const selectItem = React.useCallback(
    (item: ComboboxItemData) => {
      if (item.disabled) return
      if (multiple) {
        const exists = selectedValues.includes(item.value)
        const next = exists
          ? selectedValues.filter((v) => v !== item.value)
          : [...selectedValues, item.value]
        commitValues(next)
        if (closeOnSelect) setOpen(false)
      } else {
        commitValues([item.value])
        setInputValue(item.label)
        if (closeOnSelect) setOpen(false)
      }
    },
    [
      multiple,
      selectedValues,
      commitValues,
      closeOnSelect,
      setOpen,
      setInputValue,
    ],
  )

  const clearAll = React.useCallback(() => {
    setInputValue("")
    if (!multiple) commitValues([])
  }, [setInputValue, multiple, commitValues])

  const isSelected = React.useCallback(
    (value: string) => selectedValues.includes(value),
    [selectedValues],
  )

  const getItemId = React.useCallback(
    (index: number) => `${baseId}-item-${index}`,
    [baseId],
  )

  // Reset highlight when popup closes or item set shrinks past current index.
  React.useEffect(() => {
    if (!open) {
      setHighlightedIndexState(-1)
      return
    }
    setHighlightedIndexState((prev) => {
      if (prev >= items.length) return items.length === 0 ? -1 : 0
      return prev
    })
  }, [items, open])

  return {
    items,
    inputValue,
    selectedValues,
    open,
    highlightedIndex,
    multiple,
    disabled,
    closeOnSelect,
    loopFocus,
    openOnClick,
    baseId,
    listId,
    inputId,
    labelId,
    getItemId,
    setOpen,
    setInputValue,
    setHighlightedIndex,
    selectItem,
    isSelected,
    clearAll,
  }
}
