"use client"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"

import { cn } from "@lib/utils"
import { formatBucketLabel, toBucketDate } from "./labels"
import type { BucketLayout, TimelineBucket, TimelineGranularity } from "./types"

export interface VirtualizedTimelineScrubberProps<T> {
  buckets: TimelineBucket<T>[]
  layout: BucketLayout
  granularity: TimelineGranularity
  scrollTop: number
  viewportHeight: number
  railHeight: number
  onScrubTo: (scrollTop: number) => void
  className?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function VirtualizedTimelineScrubber<T>({
  buckets,
  layout,
  granularity,
  scrollTop,
  viewportHeight,
  railHeight,
  onScrubTo,
  className,
}: VirtualizedTimelineScrubberProps<T>) {
  const railRef = React.useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [hoverY, setHoverY] = React.useState<number | null>(null)
  const frame = React.useRef(0)
  const pendingClientY = React.useRef<number | null>(null)

  const maxScroll = Math.max(0, layout.totalSize - viewportHeight)

  const activeIndex = React.useMemo(() => {
    let index = 0
    for (let i = 0; i < layout.offsets.length; i += 1) {
      if (layout.offsets[i]! <= scrollTop) index = i
      else break
    }
    return index
  }, [layout.offsets, scrollTop])

  const scrubToClientY = React.useCallback(
    (clientY: number) => {
      const rail = railRef.current
      if (!rail || layout.totalSize <= 0) return
      const rect = rail.getBoundingClientRect()
      const ratio = clamp((clientY - rect.top) / (rect.height || 1), 0, 1)
      onScrubTo(
        clamp(ratio * layout.totalSize - viewportHeight / 2, 0, maxScroll),
      )
    },
    [layout.totalSize, maxScroll, onScrubTo, viewportHeight],
  )

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
    scrubToClientY(event.clientY)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    setHoverY(event.clientY - event.currentTarget.getBoundingClientRect().top)
    if (!dragging) return
    const { clientY } = event
    // Leading edge fires immediately so a single move responds without
    // waiting a frame; a burst of moves within that frame collapses to one
    // trailing update at the latest position instead of flooding renders.
    if (frame.current) {
      pendingClientY.current = clientY
      return
    }
    scrubToClientY(clientY)
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      if (pendingClientY.current !== null) {
        const next = pendingClientY.current
        pendingClientY.current = null
        scrubToClientY(next)
      }
    })
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDragging(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = (delta: number) => {
      event.preventDefault()
      // Jumps to the bucket's own offset, not clamped to maxScroll: a
      // trailing bucket shorter than the viewport has an offset past the
      // scrollable max, and the browser clamps the resulting scrollTop
      // assignment itself.
      const next = clamp(activeIndex + delta, 0, buckets.length - 1)
      onScrubTo(layout.offsets[next] ?? 0)
    }
    // A year's worth of buckets, so PageUp/PageDown cover a long library in a
    // handful of presses rather than one month at a time.
    const bucketsPerYear = () => {
      const current = buckets[activeIndex]
      if (!current) return 12
      const year = toBucketDate(current.date).getFullYear()
      const count = buckets.filter(
        (bucket) => toBucketDate(bucket.date).getFullYear() === year,
      ).length
      return Math.max(1, count)
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") step(1)
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") step(-1)
    else if (event.key === "PageDown") step(bucketsPerYear())
    else if (event.key === "PageUp") step(-bucketsPerYear())
    else if (event.key === "Home") {
      event.preventDefault()
      onScrubTo(0)
    } else if (event.key === "End") {
      event.preventDefault()
      onScrubTo(maxScroll)
    }
  }

  React.useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    },
    [],
  )

  const hoverLabel = React.useMemo(() => {
    if (hoverY === null || layout.totalSize <= 0) return null
    const target = (hoverY / (railHeight || 1)) * layout.totalSize
    let index = 0
    for (let i = 0; i < layout.offsets.length; i += 1) {
      if (layout.offsets[i]! <= target) index = i
      else break
    }
    const bucket = buckets[index]
    return bucket ? formatBucketLabel(bucket, granularity) : null
  }, [
    buckets,
    granularity,
    hoverY,
    layout.offsets,
    layout.totalSize,
    railHeight,
  ])

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={0}
      aria-label="Scroll through the timeline by date"
      aria-valuemin={0}
      aria-valuemax={Math.round(maxScroll)}
      aria-valuenow={Math.round(scrollTop)}
      aria-valuetext={
        buckets[activeIndex]
          ? formatBucketLabel(buckets[activeIndex]!, granularity)
          : undefined
      }
      data-dragging={dragging ? "true" : undefined}
      className={cn("dr-virtualized-timeline-scrubber", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setHoverY(null)}
      onKeyDown={handleKeyDown}
    >
      {buckets.map((bucket, index) => {
        const height = layout.heights[index] ?? 0
        const share = layout.totalSize > 0 ? height / layout.totalSize : 0
        const label = formatBucketLabel(bucket, granularity)
        return (
          <div
            key={bucket.id}
            className="dr-virtualized-timeline-scrubber-segment"
            data-active={index === activeIndex ? "true" : undefined}
            style={{ flexGrow: share }}
          >
            <span aria-hidden="true">{label}</span>
          </div>
        )
      })}
      {hoverLabel ? (
        <span
          aria-hidden="true"
          className="dr-virtualized-timeline-scrubber-label"
          style={{ top: hoverY ?? 0 }}
        >
          {hoverLabel}
        </span>
      ) : null}
    </div>
  )
}
