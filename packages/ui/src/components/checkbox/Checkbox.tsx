"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import "./checkbox.css"

import { useCheckbox, isIndeterminate, type CheckedState } from "./useCheckbox"

export type CheckboxSize = "sm" | "default" | "lg"

const checkIconSize: Record<CheckboxSize, string> = {
  sm: "h-3 w-3",
  default: "h-4 w-4",
  lg: "h-4.5 w-4.5",
}

interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value" | "onChange" | "checked" | "defaultChecked"
> {
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: CheckedState) => void
  required?: boolean
  name?: string
  value?: string
  form?: string
  size?: CheckboxSize
  ref?: React.Ref<HTMLButtonElement>
}

function Checkbox({
  className,
  size = "default",
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
  onKeyDown,
  ...props
}: CheckboxProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const {
    checked,
    state,
    disabled: isDisabled,
    toggle,
  } = useCheckbox({
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    disabled,
    required,
  })

  React.useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.indeterminate = isIndeterminate(checked)
  }, [checked])

  return (
    <>
      <button
        ref={composedRef}
        type="button"
        role="checkbox"
        aria-checked={isIndeterminate(checked) ? "mixed" : checked}
        aria-required={required}
        data-state={state}
        data-disabled={isDisabled ? "" : undefined}
        disabled={isDisabled}
        value={value}
        className={cn("dr-checkbox", className)}
        data-size={size}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          toggle()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (event.key === "Enter") event.preventDefault()
        }}
        {...props}
      >
        {(checked === true || isIndeterminate(checked)) && (
          <span className="grid place-content-center text-current">
            <Check className={checkIconSize[size]} />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="checkbox"
        aria-hidden
        tabIndex={-1}
        name={name}
        value={value}
        checked={checked === true}
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

export { Checkbox }
