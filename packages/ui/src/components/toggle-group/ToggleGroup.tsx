"use client"

import * as React from "react"

import { composeRefs } from "@primitives/slot"
import { cn } from "@lib/utils"
import type { ToggleVariant, ToggleSize } from "@components/toggle"
import "./toggle-group.css"

import {
  useToggleGroup,
  type ToggleGroupContextValue,
  type ToggleGroupOrientation,
  type UseToggleGroupOptions,
} from "./useToggleGroup"

interface ToggleGroupStyleContextValue {
  variant?: ToggleVariant
  size?: ToggleSize
}

const ToggleGroupStyleContext =
  React.createContext<ToggleGroupStyleContextValue>({
    size: "default",
    variant: "default",
  })

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
  null,
)

function useToggleGroupContext(consumer: string): ToggleGroupContextValue {
  const ctx = React.useContext(ToggleGroupContext)
  if (!ctx) throw new Error(`${consumer} must be used within <ToggleGroup>`)
  return ctx
}

type ToggleGroupSingleProps = {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

type ToggleGroupMultipleProps = {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type ToggleGroupCommonProps = {
  variant?: ToggleVariant
  size?: ToggleSize
  disabled?: boolean
  orientation?: ToggleGroupOrientation
  loop?: boolean
  rovingFocus?: boolean
  className?: string
  children?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
  dir?: "ltr" | "rtl"
} & Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "dir" | "role"
>

type ToggleGroupProps =
  | (ToggleGroupCommonProps & ToggleGroupSingleProps)
  | (ToggleGroupCommonProps & ToggleGroupMultipleProps)

function ToggleGroup(props: ToggleGroupProps) {
  const {
    className,
    variant,
    size,
    children,
    ref,
    disabled,
    orientation,
    loop,
    rovingFocus,
    dir,
    ...rest
  } = props

  const groupOptions = (
    props.type === "single"
      ? {
          type: "single",
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
          disabled,
          orientation,
          loop,
          rovingFocus,
        }
      : {
          type: "multiple",
          value: props.value,
          defaultValue: props.defaultValue,
          onValueChange: props.onValueChange,
          disabled,
          orientation,
          loop,
          rovingFocus,
        }
  ) as UseToggleGroupOptions

  const ctx = useToggleGroup(groupOptions)
  const styleCtx = React.useMemo(() => ({ variant, size }), [variant, size])

  const {
    type: _type,
    value: _v,
    defaultValue: _dv,
    onValueChange: _ovc,
    ...domProps
  } = rest as Record<string, unknown>
  void _type
  void _v
  void _dv
  void _ovc

  return (
    <div
      ref={ref}
      role="group"
      dir={dir}
      data-orientation={ctx.orientation}
      className={cn("dr-toggle-group", className)}
      {...(domProps as React.HTMLAttributes<HTMLDivElement>)}
    >
      <ToggleGroupContext.Provider value={ctx}>
        <ToggleGroupStyleContext.Provider value={styleCtx}>
          {children}
        </ToggleGroupStyleContext.Provider>
      </ToggleGroupContext.Provider>
    </div>
  )
}

interface ToggleGroupItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value" | "onChange"
> {
  value: string
  variant?: ToggleVariant
  size?: ToggleSize
  ref?: React.Ref<HTMLButtonElement>
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ref,
  value,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: ToggleGroupItemProps) {
  const ctx = useToggleGroupContext("ToggleGroupItem")
  const styleCtx = React.useContext(ToggleGroupStyleContext)
  const resolvedVariant = variant ?? styleCtx.variant ?? "default"
  const resolvedSize = size ?? styleCtx.size ?? "default"
  const isDisabled = ctx.disabled || disabled === true

  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = composeRefs(ref, buttonRef)

  const register = ctx.registerItem
  React.useEffect(() => {
    return register(value, buttonRef.current, isDisabled)
  }, [register, value, isDisabled])

  const pressed = ctx.isPressed(value)
  const tabIndex = ctx.rovingFocus
    ? ctx.isFirstFocusable(value)
      ? 0
      : -1
    : undefined

  const isSingle = ctx.type === "single"

  return (
    <button
      ref={composedRef}
      type="button"
      role={isSingle ? "radio" : undefined}
      aria-checked={isSingle ? pressed : undefined}
      aria-pressed={!isSingle ? pressed : undefined}
      data-state={pressed ? "on" : "off"}
      data-disabled={isDisabled ? "" : undefined}
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      disabled={isDisabled}
      tabIndex={tabIndex}
      className={cn("dr-toggle", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggleItem(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.handleItemKeyDown(event, value)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export { ToggleGroup, ToggleGroupItem }
