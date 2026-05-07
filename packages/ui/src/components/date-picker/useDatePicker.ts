"use client"

import { useControllableState, useEvent } from "@primitives/state"

export type DatePickerMode = "single" | "range"

export interface UseDatePickerOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

export interface UseDatePickerReturn {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
  state: "open" | "closed"
  disabled: boolean
}

export function useDatePicker(
  options: UseDatePickerOptions = {},
): UseDatePickerReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    disabled = false,
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const toggle = useEvent(() => {
    if (disabled) return
    setOpen(!open)
  })

  return {
    open,
    setOpen,
    toggle,
    state: open ? "open" : "closed",
    disabled,
  }
}
