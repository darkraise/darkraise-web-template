"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import "./toggle.css"

import { useToggle } from "./useToggle"

export type ToggleVariant = "default" | "outline"
export type ToggleSize = "default" | "sm" | "lg"

interface ToggleProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onChange"
> {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: ToggleVariant
  size?: ToggleSize
  ref?: React.Ref<HTMLButtonElement>
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  ref,
  pressed: pressedProp,
  defaultPressed,
  onPressedChange,
  disabled,
  onClick,
  ...props
}: ToggleProps) {
  const { getButtonProps } = useToggle({
    pressed: pressedProp,
    defaultPressed,
    onPressedChange,
    disabled,
  })

  return (
    <button
      ref={ref}
      className={cn("dr-toggle", className)}
      data-variant={variant}
      data-size={size}
      {...getButtonProps({ onClick, ...props })}
    />
  )
}

export { Toggle }
