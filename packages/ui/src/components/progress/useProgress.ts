const DEFAULT_MAX = 100

export type ProgressState = "indeterminate" | "complete" | "loading"

export interface UseProgressOptions {
  value?: number | null
  max?: number
  getValueLabel?: (value: number, max: number) => string
}

export interface UseProgressReturn {
  value: number | null
  max: number
  state: ProgressState
  percent: number
  valueLabel: string | undefined
  rootProps: {
    role: "progressbar"
    "aria-valuemax": number
    "aria-valuemin": 0
    "aria-valuenow": number | undefined
    "aria-valuetext": string | undefined
    "data-state": ProgressState
    "data-value": number | undefined
    "data-max": number
  }
  indicatorProps: {
    "data-state": ProgressState
    "data-value": number | undefined
    "data-max": number
    style: { transform: string }
  }
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

function getProgressState(
  value: number | null | undefined,
  maxValue: number,
): ProgressState {
  if (value == null) return "indeterminate"
  return value === maxValue ? "complete" : "loading"
}

export function useProgress(
  options: UseProgressOptions = {},
): UseProgressReturn {
  const {
    value: valueProp = null,
    max: maxProp,
    getValueLabel = defaultGetValueLabel,
  } = options

  const max = isValidMax(maxProp) ? maxProp : DEFAULT_MAX
  const value =
    valueProp !== null && isValidValue(valueProp, max) ? valueProp : null
  const valueLabel =
    typeof value === "number" ? getValueLabel(value, max) : undefined
  const state = getProgressState(value, max)
  const percent = typeof value === "number" ? value / max : 0

  return {
    value,
    max,
    state,
    percent,
    valueLabel,
    rootProps: {
      role: "progressbar",
      "aria-valuemax": max,
      "aria-valuemin": 0,
      "aria-valuenow": typeof value === "number" ? value : undefined,
      "aria-valuetext": valueLabel,
      "data-state": state,
      "data-value": value ?? undefined,
      "data-max": max,
    },
    indicatorProps: {
      "data-state": state,
      "data-value": value ?? undefined,
      "data-max": max,
      style: { transform: `translateX(-${100 - percent * 100}%)` },
    },
  }
}
