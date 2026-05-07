import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export interface UseSwitchOptions {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  required?: boolean
}

export interface UseSwitchReturn {
  checked: boolean
  setChecked: (next: boolean) => void
  toggle: () => void
  state: "checked" | "unchecked"
  disabled: boolean
  required: boolean
  getButtonProps: (
    extra?: React.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    "data-state": "checked" | "unchecked"
    "data-disabled"?: ""
    role: "switch"
    "aria-checked": boolean
    "aria-required"?: boolean
  }
}

export function useSwitch(options: UseSwitchOptions): UseSwitchReturn {
  const {
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    disabled = false,
    required,
  } = options

  const [checked, setChecked] = useControllableState<boolean>({
    value: checkedProp,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  })

  const toggle = useEvent(() => {
    if (disabled) return
    setChecked(!checked)
  })

  const state: "checked" | "unchecked" = checked ? "checked" : "unchecked"

  const getButtonProps: UseSwitchReturn["getButtonProps"] = (extra) => {
    const { onClick, role: _role, ...rest } = extra ?? {}
    void _role
    return {
      ...rest,
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-required": required,
      "data-state": state,
      "data-disabled": disabled ? "" : undefined,
      disabled,
      onClick: (event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        toggle()
      },
    }
  }

  return {
    checked,
    setChecked,
    toggle,
    state,
    disabled,
    required: required ?? false,
    getButtonProps,
  }
}
