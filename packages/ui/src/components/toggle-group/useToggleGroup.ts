import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export type ToggleGroupOrientation = "horizontal" | "vertical"

export interface UseToggleGroupSingleOptions {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export interface UseToggleGroupMultipleOptions {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export interface UseToggleGroupCommonOptions {
  disabled?: boolean
  orientation?: ToggleGroupOrientation
  loop?: boolean
  rovingFocus?: boolean
}

export type UseToggleGroupOptions = UseToggleGroupCommonOptions &
  (UseToggleGroupSingleOptions | UseToggleGroupMultipleOptions)

export interface ToggleGroupContextValue {
  type: "single" | "multiple"
  value: string[]
  toggleItem: (itemValue: string) => void
  isPressed: (itemValue: string) => boolean
  disabled: boolean
  orientation: ToggleGroupOrientation
  rovingFocus: boolean
  loop: boolean
  registerItem: (
    value: string,
    el: HTMLElement | null,
    isDisabled: boolean,
  ) => () => void
  focusItemByValue: (value: string) => void
  handleItemKeyDown: (event: React.KeyboardEvent, value: string) => void
  isFirstFocusable: (value: string) => boolean
}

interface ItemRecord {
  value: string
  el: HTMLElement
  disabled: boolean
}

export function useToggleGroup(
  options: UseToggleGroupOptions,
): ToggleGroupContextValue {
  const {
    type,
    disabled = false,
    orientation = "horizontal",
    loop = true,
    rovingFocus = true,
  } = options

  const isSingle = type === "single"
  const singleValue = isSingle
    ? (options as UseToggleGroupSingleOptions).value
    : undefined
  const singleDefault = isSingle
    ? (options as UseToggleGroupSingleOptions).defaultValue
    : undefined
  const singleOnChange = isSingle
    ? (options as UseToggleGroupSingleOptions).onValueChange
    : undefined

  const multiValue = !isSingle
    ? (options as UseToggleGroupMultipleOptions).value
    : undefined
  const multiDefault = !isSingle
    ? (options as UseToggleGroupMultipleOptions).defaultValue
    : undefined
  const multiOnChange = !isSingle
    ? (options as UseToggleGroupMultipleOptions).onValueChange
    : undefined

  const [singleState, setSingleState] = useControllableState<string>({
    value: singleValue,
    defaultValue: singleDefault ?? "",
    onChange: singleOnChange,
  })

  const [multiState, setMultiState] = useControllableState<string[]>({
    value: multiValue,
    defaultValue: multiDefault ?? [],
    onChange: multiOnChange,
  })

  const value = isSingle ? (singleState ? [singleState] : []) : multiState

  const isPressed = useEvent((itemValue: string) => value.includes(itemValue))

  const toggleItem = useEvent((itemValue: string) => {
    if (disabled) return
    if (isSingle) {
      setSingleState(singleState === itemValue ? "" : itemValue)
    } else {
      const next = multiState.includes(itemValue)
        ? multiState.filter((v) => v !== itemValue)
        : [...multiState, itemValue]
      setMultiState(next)
    }
  })

  const itemsRef = React.useRef<ItemRecord[]>([])
  const [, setRegistrationVersion] = React.useState(0)

  const registerItem = useEvent(
    (itemValue: string, el: HTMLElement | null, isDisabled: boolean) => {
      if (!el) {
        itemsRef.current = itemsRef.current.filter((i) => i.value !== itemValue)
        setRegistrationVersion((v) => v + 1)
        return () => {}
      }
      const existing = itemsRef.current.find((i) => i.value === itemValue)
      if (existing) {
        existing.el = el
        existing.disabled = isDisabled
      } else {
        itemsRef.current.push({ value: itemValue, el, disabled: isDisabled })
      }
      setRegistrationVersion((v) => v + 1)
      return () => {
        itemsRef.current = itemsRef.current.filter((i) => i.value !== itemValue)
        setRegistrationVersion((v) => v + 1)
      }
    },
  )

  const orderedItems = useEvent(() => {
    const list = [...itemsRef.current]
    list.sort((a, b) => {
      const cmp = a.el.compareDocumentPosition(b.el)
      if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
    return list.filter((i) => !i.disabled)
  })

  const focusItemByValue = useEvent((target: string) => {
    const item = itemsRef.current.find((i) => i.value === target)
    item?.el.focus()
  })

  const isFirstFocusable = useEvent((itemValue: string) => {
    const list = orderedItems()
    const activeFocusable = list.find((i) => isPressed(i.value)) ?? list[0]
    return activeFocusable?.value === itemValue
  })

  const handleItemKeyDown = useEvent(
    (event: React.KeyboardEvent, itemValue: string) => {
      const list = orderedItems()
      if (list.length === 0) return
      const idx = list.findIndex((i) => i.value === itemValue)
      if (idx === -1) return

      const horiz = orientation === "horizontal"
      const next = horiz ? "ArrowRight" : "ArrowDown"
      const prev = horiz ? "ArrowLeft" : "ArrowUp"

      let nextIdx: number | null = null
      if (event.key === next) nextIdx = idx + 1
      else if (event.key === prev) nextIdx = idx - 1
      else if (event.key === "Home") nextIdx = 0
      else if (event.key === "End") nextIdx = list.length - 1

      if (nextIdx === null) return

      if (loop) {
        nextIdx = ((nextIdx % list.length) + list.length) % list.length
      } else {
        nextIdx = Math.max(0, Math.min(list.length - 1, nextIdx))
      }

      event.preventDefault()
      list[nextIdx]?.el.focus()
    },
  )

  return {
    type,
    value,
    toggleItem,
    isPressed,
    disabled,
    orientation,
    rovingFocus,
    loop,
    registerItem,
    focusItemByValue,
    handleItemKeyDown,
    isFirstFocusable,
  }
}
