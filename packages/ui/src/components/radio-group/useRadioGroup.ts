import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export type RadioGroupOrientation = "horizontal" | "vertical"

export interface UseRadioGroupOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  orientation?: RadioGroupOrientation
  loop?: boolean
}

interface ItemRecord {
  value: string
  el: HTMLElement
  disabled: boolean
}

export interface RadioGroupContextValue {
  value: string
  setValue: (next: string) => void
  disabled: boolean
  required: boolean
  orientation: RadioGroupOrientation
  loop: boolean
  registerItem: (
    value: string,
    el: HTMLElement | null,
    isDisabled: boolean,
  ) => () => void
  isFirstFocusable: (value: string) => boolean
  handleItemKeyDown: (event: React.KeyboardEvent, value: string) => void
}

export function useRadioGroup(
  options: UseRadioGroupOptions,
): RadioGroupContextValue {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    disabled = false,
    required = false,
    orientation = "vertical",
    loop = true,
  } = options

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
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

  const isFirstFocusable = (itemValue: string) => {
    const list = orderedItems()
    const checked = list.find((i) => i.value === value)
    if (checked) return checked.value === itemValue
    return list[0]?.value === itemValue
  }

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
      const target = list[nextIdx]
      if (!target) return
      target.el.focus()
      setValue(target.value)
    },
  )

  return {
    value,
    setValue,
    disabled,
    required,
    orientation,
    loop,
    registerItem,
    isFirstFocusable,
    handleItemKeyDown,
  }
}
