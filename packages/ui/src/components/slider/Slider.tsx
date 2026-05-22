"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import "./slider.css"

import {
  useSlider,
  type SliderOrientation,
  type UseSliderOptions,
} from "./useSlider"

interface SliderProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "defaultValue" | "onChange" | "role"
> {
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
  name?: string
  /**
   * When true, render a small anchor dot on the track at every step
   * position so users can see the discrete stops the thumb will snap
   * to. Only rendered when the total number of stops
   * (`(max - min) / step + 1`) is below 20 — past that the dots become
   * visual noise and the request is silently ignored. */
  showSteps?: boolean
  ref?: React.Ref<HTMLSpanElement>
}

/** Inclusive cap on how many stop indicators we ever render. Past this
 *  count the dots crowd into each other and hurt the track more than
 *  they help; we silently drop them. */
const MAX_VISIBLE_STEPS = 20

function Slider({
  className,
  ref,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  step,
  orientation,
  disabled,
  inverted,
  name,
  showSteps,
  ...props
}: SliderProps) {
  const opts: UseSliderOptions = {
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    min,
    max,
    step,
    orientation,
    disabled,
    inverted,
  }
  const slider = useSlider(opts)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const draggingRef = React.useRef<{
    pointerId: number
    thumbIndex: number
  } | null>(null)

  const handleRef = React.useCallback(
    (node: HTMLSpanElement | null) => {
      ;(rootRef as React.MutableRefObject<HTMLSpanElement | null>).current =
        node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node
    },
    [ref],
  )

  const onPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (slider.disabled) return
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const target = slider.pointerToValue(rect, event.clientX, event.clientY)
    const idx = slider.closestThumbIndex(target)
    slider.setActiveThumbIndex(idx)
    slider.setValueAtIndex(idx, target)
    root.setPointerCapture(event.pointerId)
    draggingRef.current = { pointerId: event.pointerId, thumbIndex: idx }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    const target = slider.pointerToValue(rect, event.clientX, event.clientY)
    slider.setValueAtIndex(drag.thumbIndex, target)
  }

  const finishDrag = (event: React.PointerEvent<HTMLSpanElement>) => {
    const drag = draggingRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const root = rootRef.current
    if (root && root.hasPointerCapture(event.pointerId)) {
      root.releasePointerCapture(event.pointerId)
    }
    draggingRef.current = null
    slider.commit()
  }

  const horizontal = slider.orientation === "horizontal"

  // Resolve step anchor positions. Bail when `showSteps` is off, when
  // the math would diverge (non-positive step), or when the requested
  // count exceeds MAX_VISIBLE_STEPS. We render fractional positions
  // (0..1) so the same array works in both orientations via CSS.
  //
  // The first and last stops are intentionally omitted — the track's
  // own start/end edges already mark them visually, and rendering dots
  // there competes with the thumb when it sits at min or max.
  const stepPositions: number[] = React.useMemo(() => {
    if (!showSteps) return []
    if (slider.step <= 0) return []
    const stopCount = Math.floor((slider.max - slider.min) / slider.step) + 1
    if (stopCount < 3 || stopCount > MAX_VISIBLE_STEPS) return []
    const positions: number[] = []
    for (let i = 1; i < stopCount - 1; i++) {
      positions.push(i / (stopCount - 1))
    }
    return positions
  }, [showSteps, slider.min, slider.max, slider.step])

  // Range fills from 0 to first thumb (single thumb), or between two thumbs.
  const sortedPercents = slider.values
    .map((v) => slider.percent(v))
    .sort((a, b) => a - b)
  const rangeStart = sortedPercents.length > 1 ? (sortedPercents[0] ?? 0) : 0
  const rangeEnd = sortedPercents[sortedPercents.length - 1] ?? 0

  const rangeStyle: React.CSSProperties = horizontal
    ? {
        position: "absolute",
        left: `${rangeStart * 100}%`,
        right: `${(1 - rangeEnd) * 100}%`,
        top: 0,
        bottom: 0,
      }
    : {
        position: "absolute",
        bottom: `${rangeStart * 100}%`,
        top: `${(1 - rangeEnd) * 100}%`,
        left: 0,
        right: 0,
      }

  return (
    <span
      ref={handleRef}
      data-orientation={slider.orientation}
      data-disabled={slider.disabled ? "" : undefined}
      className={cn("dr-slider", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        position: "relative",
        touchAction: horizontal ? "pan-y" : "pan-x",
        ...props.style,
      }}
      {...props}
    >
      <span
        data-orientation={slider.orientation}
        data-disabled={slider.disabled ? "" : undefined}
        className="dr-slider-track"
      >
        <span
          data-orientation={slider.orientation}
          data-disabled={slider.disabled ? "" : undefined}
          className="dr-slider-range"
          style={rangeStyle}
        />
        {stepPositions.map((pos, i) => {
          const pct = pos * 100
          const dotStyle: React.CSSProperties = horizontal
            ? {
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }
            : {
                position: "absolute",
                bottom: `${pct}%`,
                left: "50%",
                transform: "translate(-50%, 50%)",
              }
          return (
            <span
              key={`step-${i}`}
              aria-hidden
              data-orientation={slider.orientation}
              className="dr-slider-step"
              style={dotStyle}
            />
          )
        })}
      </span>
      {slider.values.map((value, i) => {
        const pct = slider.percent(value) * 100
        const thumbStyle: React.CSSProperties = horizontal
          ? {
              position: "absolute",
              left: `${pct}%`,
              transform: "translate(-50%, -50%)",
              top: "50%",
            }
          : {
              position: "absolute",
              bottom: `${pct}%`,
              transform: "translate(-50%, 50%)",
              left: "50%",
            }
        return (
          <span
            key={i}
            role="slider"
            tabIndex={slider.disabled ? -1 : 0}
            aria-orientation={slider.orientation}
            aria-valuemin={slider.min}
            aria-valuemax={slider.max}
            aria-valuenow={value}
            data-orientation={slider.orientation}
            data-disabled={slider.disabled ? "" : undefined}
            className="dr-slider-thumb"
            style={thumbStyle}
            onKeyDown={(event) => slider.handleThumbKeyDown(event, i)}
            onFocus={() => slider.setActiveThumbIndex(i)}
          />
        )
      })}
      {name !== undefined &&
        slider.values.map((v, i) => (
          <input
            key={`hidden-${i}`}
            type="number"
            aria-hidden
            tabIndex={-1}
            name={slider.values.length > 1 ? `${name}[]` : name}
            value={v}
            readOnly
            style={{
              position: "absolute",
              pointerEvents: "none",
              opacity: 0,
              margin: 0,
              transform: "translateX(-100%)",
            }}
          />
        ))}
    </span>
  )
}

export { Slider }
