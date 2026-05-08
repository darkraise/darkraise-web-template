import * as React from "react"
import { useControllableState } from "@primitives/state"

export interface UseAngleSliderOptions {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  step?: number
}

export function useAngleSlider({
  value,
  defaultValue,
  onValueChange,
  step = 1,
}: UseAngleSliderOptions) {
  const [angle, setAngle] = useControllableState<number>({
    value,
    defaultValue: defaultValue ?? 0,
    onChange: onValueChange,
  })

  const wrap = (v: number) => ((v % 360) + 360) % 360

  const set = (next: number) => {
    setAngle(wrap(next))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = angle + step
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = angle - step
    } else if (event.key === "Home") {
      next = 0
    } else if (event.key === "End") {
      next = 359
    }
    if (next !== null) {
      event.preventDefault()
      set(next)
    }
  }

  const handlePointer = (
    event: React.PointerEvent<HTMLDivElement>,
    rect: DOMRect,
  ) => {
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = event.clientX - cx
    const dy = event.clientY - cy
    const rad = Math.atan2(dy, dx)
    const deg = wrap(Math.round((rad * 180) / Math.PI + 90))
    set(deg)
  }

  return { angle, setAngle: set, handleKeyDown, handlePointer }
}
