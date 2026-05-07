import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export interface UseToggleOptions {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  disabled?: boolean
}

export interface UseToggleReturn {
  pressed: boolean
  setPressed: (next: boolean) => void
  toggle: () => void
  state: "on" | "off"
  disabled: boolean
  getButtonProps: (
    extra?: React.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => React.ButtonHTMLAttributes<HTMLButtonElement>
}

export function useToggle(options: UseToggleOptions): UseToggleReturn {
  const {
    pressed: pressedProp,
    defaultPressed,
    onPressedChange,
    disabled = false,
  } = options

  const [pressed, setPressed] = useControllableState<boolean>({
    value: pressedProp,
    defaultValue: defaultPressed ?? false,
    onChange: onPressedChange,
  })

  const toggle = useEvent(() => {
    if (disabled) return
    setPressed(!pressed)
  })

  const state: "on" | "off" = pressed ? "on" : "off"

  const getButtonProps: UseToggleReturn["getButtonProps"] = (extra) => {
    const { onClick, ...rest } = extra ?? {}
    return {
      ...rest,
      type: "button",
      "aria-pressed": pressed,
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

  return { pressed, setPressed, toggle, state, disabled, getButtonProps }
}
