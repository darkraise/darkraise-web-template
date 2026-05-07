import * as React from "react"

import { useControllableState, useEvent } from "@primitives/state"

export type SliderOrientation = "horizontal" | "vertical"

export interface UseSliderOptions {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  orientation?: SliderOrientation
  disabled?: boolean
  inverted?: boolean
}

export interface UseSliderReturn {
  values: number[]
  min: number
  max: number
  step: number
  orientation: SliderOrientation
  disabled: boolean
  inverted: boolean
  activeThumbIndex: number
  setActiveThumbIndex: (idx: number) => void
  setValueAtIndex: (idx: number, next: number) => void
  commit: () => void
  handleThumbKeyDown: (event: React.KeyboardEvent, thumbIndex: number) => void
  pointerToValue: (rect: DOMRect, clientX: number, clientY: number) => number
  closestThumbIndex: (target: number) => number
  percent: (value: number) => number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function snap(n: number, step: number, min: number) {
  if (step <= 0) return n
  const stepped = Math.round((n - min) / step) * step + min
  return Number(stepped.toFixed(10))
}

export function useSlider(options: UseSliderOptions): UseSliderReturn {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    orientation = "horizontal",
    disabled = false,
    inverted = false,
  } = options

  const [values, setValues] = useControllableState<number[]>({
    value: valueProp,
    defaultValue: defaultValue ?? [min],
    onChange: onValueChange,
  })

  const [activeThumbIndex, setActiveThumbIndex] = React.useState(0)

  const setValueAtIndex = useEvent((idx: number, next: number) => {
    if (disabled) return
    const clamped = clamp(snap(next, step, min), min, max)
    const list = [...values]
    list[idx] = clamped
    list.sort((a, b) => a - b)
    if (
      list.length === values.length &&
      list.every((v, i) => v === values[i])
    ) {
      return
    }
    setValues(list)
  })

  const commit = useEvent(() => {
    onValueCommit?.(values)
  })

  const handleThumbKeyDown = useEvent(
    (event: React.KeyboardEvent, thumbIndex: number) => {
      if (disabled) return
      const current = values[thumbIndex] ?? min
      let next: number | null = null
      const big = step * 10
      const incrementKey =
        orientation === "horizontal"
          ? inverted
            ? "ArrowLeft"
            : "ArrowRight"
          : inverted
            ? "ArrowDown"
            : "ArrowUp"
      const decrementKey =
        orientation === "horizontal"
          ? inverted
            ? "ArrowRight"
            : "ArrowLeft"
          : inverted
            ? "ArrowUp"
            : "ArrowDown"

      if (event.key === incrementKey) {
        next = current + (event.shiftKey ? big : step)
      } else if (event.key === decrementKey) {
        next = current - (event.shiftKey ? big : step)
      } else if (event.key === "Home") {
        next = min
      } else if (event.key === "End") {
        next = max
      } else if (event.key === "PageUp") {
        next = current + big
      } else if (event.key === "PageDown") {
        next = current - big
      }

      if (next === null) return
      event.preventDefault()
      setValueAtIndex(thumbIndex, next)
    },
  )

  const pointerToValue = useEvent(
    (rect: DOMRect, clientX: number, clientY: number) => {
      const horizontal = orientation === "horizontal"
      const length = horizontal ? rect.width : rect.height
      if (length === 0) return min
      const offset = horizontal ? clientX - rect.left : clientY - rect.top
      let pct = offset / length
      if (!horizontal) pct = 1 - pct
      if (inverted) pct = 1 - pct
      const raw = min + pct * (max - min)
      return clamp(snap(raw, step, min), min, max)
    },
  )

  const closestThumbIndex = useEvent((target: number) => {
    if (values.length === 0) return 0
    let best = 0
    let bestDelta = Infinity
    values.forEach((v, i) => {
      const delta = Math.abs(v - target)
      if (delta < bestDelta) {
        best = i
        bestDelta = delta
      }
    })
    return best
  })

  const percent = useEvent((value: number) => {
    if (max === min) return 0
    let p = (value - min) / (max - min)
    if (inverted) p = 1 - p
    return p
  })

  return {
    values,
    min,
    max,
    step,
    orientation,
    disabled,
    inverted,
    activeThumbIndex,
    setActiveThumbIndex,
    setValueAtIndex,
    commit,
    handleThumbKeyDown,
    pointerToValue,
    closestThumbIndex,
    percent,
  }
}
