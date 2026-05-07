"use client"

import * as React from "react"

import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import "./switch.css"

import { useSwitch } from "./useSwitch"

interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value" | "onChange" | "defaultChecked" | "checked"
> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  required?: boolean
  name?: string
  value?: string
  form?: string
  ref?: React.Ref<HTMLButtonElement>
}

function Switch({
  className,
  ref,
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  value = "on",
  form,
  onClick,
  ...props
}: SwitchProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)

  const {
    checked,
    state,
    disabled: isDisabled,
    getButtonProps,
  } = useSwitch({
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    disabled,
    required,
  })

  const buttonProps = getButtonProps({ onClick, ...props })

  return (
    <>
      <button
        ref={composedRef}
        className={cn("dr-switch peer", className)}
        {...buttonProps}
      >
        <span data-state={state} className="dr-switch-thumb" />
      </button>
      <input
        type="checkbox"
        aria-hidden
        tabIndex={-1}
        name={name}
        value={value}
        checked={checked}
        required={required}
        disabled={isDisabled}
        form={form}
        onChange={() => {}}
        style={{
          position: "absolute",
          pointerEvents: "none",
          opacity: 0,
          margin: 0,
          transform: "translateX(-100%)",
        }}
      />
    </>
  )
}

export { Switch }
