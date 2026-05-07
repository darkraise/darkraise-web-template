"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import "./radio-group.css"

import {
  useRadioGroup,
  type RadioGroupContextValue,
  type RadioGroupOrientation,
} from "./useRadioGroup"

type RadioSize = "sm" | "default" | "lg"

interface RadioGroupCombinedContextValue extends RadioGroupContextValue {
  name?: string
}

const RadioGroupContext =
  React.createContext<RadioGroupCombinedContextValue | null>(null)

function useRadioGroupContext(
  consumer: string,
): RadioGroupCombinedContextValue {
  const ctx = React.useContext(RadioGroupContext)
  if (!ctx) throw new Error(`${consumer} must be used within <RadioGroup>`)
  return ctx
}

interface RadioGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "role"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  name?: string
  orientation?: RadioGroupOrientation
  loop?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function RadioGroup({
  className,
  ref,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  name,
  orientation,
  loop,
  children,
  ...props
}: RadioGroupProps) {
  const ctx = useRadioGroup({
    value,
    defaultValue,
    onValueChange,
    disabled,
    required,
    orientation,
    loop,
  })

  const combinedCtx = React.useMemo(() => ({ ...ctx, name }), [ctx, name])

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-required={required || undefined}
      aria-orientation={ctx.orientation}
      data-disabled={ctx.disabled ? "" : undefined}
      data-orientation={ctx.orientation}
      className={cn("dr-radio-group", className)}
      {...props}
    >
      <RadioGroupContext.Provider value={combinedCtx}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  )
}

const radioIndicatorSizeClass: Record<RadioSize, string> = {
  sm: "dr-radio-group-indicator-sm",
  default: "dr-radio-group-indicator-default",
  lg: "dr-radio-group-indicator-lg",
}

interface RadioGroupItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value" | "onChange"
> {
  value: string
  size?: RadioSize
  ref?: React.Ref<HTMLButtonElement>
}

function RadioGroupItem({
  className,
  size = "default",
  ref,
  value,
  disabled,
  onClick,
  onKeyDown,
  children,
  ...props
}: RadioGroupItemProps) {
  const ctx = useRadioGroupContext("RadioGroupItem")
  const isDisabled = ctx.disabled || disabled === true
  const isChecked = ctx.value === value

  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)

  const register = ctx.registerItem
  React.useEffect(() => {
    return register(value, buttonRef.current, isDisabled)
  }, [register, value, isDisabled])

  const tabIndex = ctx.isFirstFocusable(value) ? 0 : -1

  return (
    <>
      <button
        ref={composedRef}
        type="button"
        role="radio"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        data-disabled={isDisabled ? "" : undefined}
        data-size={size}
        disabled={isDisabled}
        tabIndex={tabIndex}
        className={cn("dr-radio-group-item", className)}
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented) return
          if (isDisabled) return
          ctx.setValue(value)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault()
            if (!isDisabled) ctx.setValue(value)
            return
          }
          ctx.handleItemKeyDown(event, value)
        }}
        {...props}
      >
        {children ??
          (isChecked && (
            <span className="flex items-center justify-center">
              <Circle
                className={cn(
                  "fill-current text-current",
                  radioIndicatorSizeClass[size],
                )}
              />
            </span>
          ))}
      </button>
      {ctx.name !== undefined && (
        <input
          type="radio"
          aria-hidden
          tabIndex={-1}
          name={ctx.name}
          value={value}
          checked={isChecked}
          required={ctx.required}
          disabled={isDisabled}
          onChange={() => {}}
          style={{
            position: "absolute",
            pointerEvents: "none",
            opacity: 0,
            margin: 0,
            transform: "translateX(-100%)",
          }}
        />
      )}
    </>
  )
}

export { RadioGroup, RadioGroupItem }
