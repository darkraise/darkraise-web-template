"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@lib/utils"
import "./radio-group.css"

type RadioSize = "sm" | "default" | "lg"

function RadioGroup({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("dr-radio-group", className)}
      {...props}
      ref={ref}
    />
  )
}

const radioIndicatorSizeClass: Record<RadioSize, string> = {
  sm: "dr-radio-group-indicator-sm",
  default: "dr-radio-group-indicator-default",
  lg: "dr-radio-group-indicator-lg",
}

function RadioGroupItem({
  className,
  size = "default",
  ref,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  size?: RadioSize
}) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-size={size}
      className={cn("dr-radio-group-item", className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle
          className={cn(
            "fill-current text-current",
            radioIndicatorSizeClass[size],
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
