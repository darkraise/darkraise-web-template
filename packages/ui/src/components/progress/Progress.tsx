import * as React from "react"

import { cn } from "@lib/utils"
import "./progress.css"

const DEFAULT_MAX = 100

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | null
  max?: number
  getValueLabel?: (value: number, max: number) => string
  ref?: React.Ref<HTMLDivElement>
}

function getProgressState(
  value: number | null | undefined,
  maxValue: number,
): "indeterminate" | "complete" | "loading" {
  if (value == null) return "indeterminate"
  return value === maxValue ? "complete" : "loading"
}

function isValidMax(max: unknown): max is number {
  return typeof max === "number" && !isNaN(max) && max > 0
}

function isValidValue(value: unknown, max: number): value is number {
  return (
    typeof value === "number" && !isNaN(value) && value <= max && value >= 0
  )
}

function defaultGetValueLabel(value: number, max: number) {
  return `${Math.round((value / max) * 100)}%`
}

function Progress({
  className,
  value: valueProp = null,
  max: maxProp,
  getValueLabel = defaultGetValueLabel,
  ref,
  ...props
}: ProgressProps) {
  const max = isValidMax(maxProp) ? maxProp : DEFAULT_MAX
  const value =
    valueProp !== null && isValidValue(valueProp, max) ? valueProp : null
  const valueLabel =
    typeof value === "number" ? getValueLabel(value, max) : undefined
  const state = getProgressState(value, max)
  const percent = typeof value === "number" ? value / max : 0

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={typeof value === "number" ? value : undefined}
      aria-valuetext={valueLabel}
      data-state={state}
      data-value={value ?? undefined}
      data-max={max}
      className={cn("dr-progress", className)}
      {...props}
    >
      <div
        data-state={state}
        data-value={value ?? undefined}
        data-max={max}
        className="dr-progress-indicator"
        style={{ transform: `translateX(-${100 - percent * 100}%)` }}
      />
    </div>
  )
}

export { Progress }
