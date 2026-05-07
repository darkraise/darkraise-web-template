import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export type AccordionType = "single" | "multiple"

export interface UseAccordionSingleOptions {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  collapsible?: boolean
}

export interface UseAccordionMultipleOptions {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export interface UseAccordionCommonOptions {
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
}

export type UseAccordionOptions = UseAccordionCommonOptions &
  (UseAccordionSingleOptions | UseAccordionMultipleOptions)

interface ItemRecord {
  value: string
  el: HTMLElement
  disabled: boolean
}

export interface AccordionContextValue {
  type: AccordionType
  isOpen: (itemValue: string) => boolean
  toggleItem: (itemValue: string, isItemDisabled: boolean) => void
  disabled: boolean
  orientation: "horizontal" | "vertical"
  registerTrigger: (
    value: string,
    el: HTMLElement | null,
    isDisabled: boolean,
  ) => () => void
  handleTriggerKeyDown: (event: React.KeyboardEvent, value: string) => void
}

export function useAccordion(
  options: UseAccordionOptions,
): AccordionContextValue {
  const { type, disabled = false, orientation = "vertical" } = options

  const isSingle = type === "single"
  const collapsible = isSingle
    ? ((options as UseAccordionSingleOptions).collapsible ?? false)
    : true

  const singleValue = isSingle
    ? (options as UseAccordionSingleOptions).value
    : undefined
  const singleDefault = isSingle
    ? (options as UseAccordionSingleOptions).defaultValue
    : undefined
  const singleOnChange = isSingle
    ? (options as UseAccordionSingleOptions).onValueChange
    : undefined

  const multiValue = !isSingle
    ? (options as UseAccordionMultipleOptions).value
    : undefined
  const multiDefault = !isSingle
    ? (options as UseAccordionMultipleOptions).defaultValue
    : undefined
  const multiOnChange = !isSingle
    ? (options as UseAccordionMultipleOptions).onValueChange
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

  const isOpen = (itemValue: string) =>
    isSingle ? singleState === itemValue : multiState.includes(itemValue)

  const toggleItem = useEvent((itemValue: string, isItemDisabled: boolean) => {
    if (disabled || isItemDisabled) return
    if (isSingle) {
      if (singleState === itemValue) {
        if (collapsible) setSingleState("")
        return
      }
      setSingleState(itemValue)
    } else {
      const next = multiState.includes(itemValue)
        ? multiState.filter((v) => v !== itemValue)
        : [...multiState, itemValue]
      setMultiState(next)
    }
  })

  const itemsRef = React.useRef<ItemRecord[]>([])

  const registerTrigger = useEvent(
    (itemValue: string, el: HTMLElement | null, isDisabled: boolean) => {
      if (!el) {
        itemsRef.current = itemsRef.current.filter((i) => i.value !== itemValue)
        return () => {}
      }
      const existing = itemsRef.current.find((i) => i.value === itemValue)
      if (existing) {
        existing.el = el
        existing.disabled = isDisabled
      } else {
        itemsRef.current.push({ value: itemValue, el, disabled: isDisabled })
      }
      return () => {
        itemsRef.current = itemsRef.current.filter((i) => i.value !== itemValue)
      }
    },
  )

  const orderedTriggers = useEvent(() => {
    const list = [...itemsRef.current]
    list.sort((a, b) => {
      const cmp = a.el.compareDocumentPosition(b.el)
      if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
    return list.filter((i) => !i.disabled)
  })

  const handleTriggerKeyDown = useEvent(
    (event: React.KeyboardEvent, itemValue: string) => {
      const list = orderedTriggers()
      const idx = list.findIndex((i) => i.value === itemValue)
      if (idx === -1) return
      const horiz = orientation === "horizontal"
      const next = horiz ? "ArrowRight" : "ArrowDown"
      const prev = horiz ? "ArrowLeft" : "ArrowUp"
      let nextIdx: number | null = null
      if (event.key === next) nextIdx = (idx + 1) % list.length
      else if (event.key === prev)
        nextIdx = (idx - 1 + list.length) % list.length
      else if (event.key === "Home") nextIdx = 0
      else if (event.key === "End") nextIdx = list.length - 1
      if (nextIdx === null) return
      event.preventDefault()
      list[nextIdx]?.el.focus()
    },
  )

  return {
    type,
    isOpen,
    toggleItem,
    disabled,
    orientation,
    registerTrigger,
    handleTriggerKeyDown,
  }
}
