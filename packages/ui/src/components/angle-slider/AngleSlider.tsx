import * as React from "react"
import { cn } from "@lib/utils"
import { useAngleSlider, type UseAngleSliderOptions } from "./useAngleSlider"
import "./angle-slider.css"

export interface AngleSliderProps
  extends
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      "onChange" | "defaultValue" | "role"
    >,
    UseAngleSliderOptions {
  disabled?: boolean
}

function AngleSlider({
  className,
  value,
  defaultValue,
  onValueChange,
  step,
  disabled,
  ...rest
}: AngleSliderProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const dragging = React.useRef(false)
  const { angle, handleKeyDown, handlePointer } = useAngleSlider({
    value,
    defaultValue,
    onValueChange,
    step,
  })

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    const node = ref.current
    if (!node) return
    dragging.current = true
    node.setPointerCapture(event.pointerId)
    handlePointer(event, node.getBoundingClientRect())
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const node = ref.current
    if (!node) return
    handlePointer(event, node.getBoundingClientRect())
  }
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    ref.current?.releasePointerCapture(event.pointerId)
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuenow={angle}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      className={cn("dr-angle-slider", className)}
      onKeyDown={disabled ? undefined : handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="dr-angle-slider-thumb"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <span className="dr-angle-slider-pointer" />
      </div>
    </div>
  )
}

export { AngleSlider }
