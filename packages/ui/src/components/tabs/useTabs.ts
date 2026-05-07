import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export type TabsOrientation = "horizontal" | "vertical"
export type TabsActivationMode = "automatic" | "manual"

export interface UseTabsOptions {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: TabsOrientation
  activationMode?: TabsActivationMode
  dir?: "ltr" | "rtl"
}

interface ItemRecord {
  value: string
  el: HTMLElement
  disabled: boolean
}

export interface TabsContextValue {
  value: string
  setValue: (next: string) => void
  orientation: TabsOrientation
  activationMode: TabsActivationMode
  dir: "ltr" | "rtl"
  registerTrigger: (
    value: string,
    el: HTMLElement | null,
    isDisabled: boolean,
  ) => () => void
  handleTriggerKeyDown: (event: React.KeyboardEvent, value: string) => void
}

export function useTabs(options: UseTabsOptions): TabsContextValue {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    activationMode = "automatic",
    dir = "ltr",
  } = options

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
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
      if (list.length === 0) return
      const idx = list.findIndex((i) => i.value === itemValue)
      if (idx === -1) return

      const horiz = orientation === "horizontal"
      const ltr = dir === "ltr"
      const next = horiz ? (ltr ? "ArrowRight" : "ArrowLeft") : "ArrowDown"
      const prev = horiz ? (ltr ? "ArrowLeft" : "ArrowRight") : "ArrowUp"

      let nextIdx: number | null = null
      if (event.key === next) nextIdx = (idx + 1) % list.length
      else if (event.key === prev)
        nextIdx = (idx - 1 + list.length) % list.length
      else if (event.key === "Home") nextIdx = 0
      else if (event.key === "End") nextIdx = list.length - 1

      if (nextIdx === null) return
      event.preventDefault()
      const target = list[nextIdx]
      if (!target) return
      target.el.focus()
      if (activationMode === "automatic") {
        setValue(target.value)
      }
    },
  )

  return {
    value,
    setValue,
    orientation,
    activationMode,
    dir,
    registerTrigger,
    handleTriggerKeyDown,
  }
}
