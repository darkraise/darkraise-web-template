"use client"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"

import { cn } from "@lib/utils"
import { formatBucketLabel, toBucketDate } from "./labels"
import { buildRailTicks } from "./railTicks"
import type { BucketLayout, TimelineBucket, TimelineGranularity } from "./types"

export interface VirtualizedTimelineScrubberProps<T> {
  buckets: TimelineBucket<T>[]
  layout: BucketLayout
  granularity: TimelineGranularity
  scrollTop: number
  viewportHeight: number
  maxScroll: number
  railHeight: number
  showLabels: boolean
  onScrubTo: (scrollTop: number) => void
  className?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function indexAtOffset(offsets: readonly number[], target: number): number {
  let index = 0
  for (let i = 0; i < offsets.length; i += 1) {
    if (offsets[i]! <= target) index = i
    else break
  }
  return index
}

export function VirtualizedTimelineScrubber<T>({
  buckets,
  layout,
  granularity,
  scrollTop,
  viewportHeight,
  maxScroll,
  railHeight,
  showLabels,
  onScrubTo,
  className,
}: VirtualizedTimelineScrubberProps<T>) {
  const railRef = React.useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [hoverY, setHoverY] = React.useState<number | null>(null)
  const [hoverLabel, setHoverLabel] = React.useState<string | null>(null)
  const frame = React.useRef(0)
  const pendingClientY = React.useRef<number | null>(null)

  const activeIndex = React.useMemo(
    () => indexAtOffset(layout.offsets, scrollTop),
    [layout.offsets, scrollTop],
  )

  const ticks = React.useMemo(
    () =>
      buildRailTicks({
        buckets,
        offsets: layout.offsets,
        totalSize: layout.totalSize,
        railHeight,
        showLabels,
      }),
    // Deliberately not keyed on scrollTop: the index is fixed while you
    // scroll, and only the caret moves. Re-deriving it per frame would
    // reconcile every tick on every frame.
    [buckets, layout.offsets, layout.totalSize, railHeight, showLabels],
  )

  const scrubToClientY = React.useCallback(
    (clientY: number) => {
      const rail = railRef.current
      if (!rail || layout.totalSize <= 0) return
      const rect = rail.getBoundingClientRect()
      const ratio = clamp(
        (clientY - rect.top) / (rect.height || railHeight || 1),
        0,
        1,
      )
      onScrubTo(
        clamp(ratio * layout.totalSize - viewportHeight / 2, 0, maxScroll),
      )
    },
    [layout.totalSize, maxScroll, onScrubTo, railHeight, viewportHeight],
  )

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDragging(true)
    scrubToClientY(event.clientY)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    // The rail's live rect is the same source scrubToClientY uses for its
    // own ratio, so the hover label and the drag target can never disagree.
    const rect = event.currentTarget.getBoundingClientRect()
    const y = event.clientY - rect.top
    setHoverY(y)
    const target = (y / (rect.height || railHeight || 1)) * layout.totalSize
    const hovered =
      layout.totalSize > 0
        ? buckets[indexAtOffset(layout.offsets, target)]
        : undefined
    setHoverLabel(hovered ? formatBucketLabel(hovered, granularity) : null)

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

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
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

  const caretY =
    layout.totalSize > 0 ? (scrollTop / layout.totalSize) * railHeight : 0
  const activeLabel = buckets[activeIndex]
    ? formatBucketLabel(buckets[activeIndex]!, granularity)
    : null

  // The viewport's footprint on the rail, from the caret down to where the
  // viewport's far edge falls. Derived from maxScroll rather than
  // viewportHeight or railHeight: those happen to agree with it today (the
  // rail and the viewport are flex siblings of equal height), but the
  // agreement is a coincidence of today's layout, not a guarantee. At
  // scrollTop === maxScroll, scrollTop + viewportSize === layout.totalSize by
  // construction, so bracketBottom lands on railHeight exactly -- no clamp.
  const viewportSize = layout.totalSize - maxScroll
  const bracketBottom =
    layout.totalSize > 0
      ? ((scrollTop + viewportSize) / layout.totalSize) * railHeight
      : 0
  const bracketHeight = bracketBottom - caretY

  return (
    <div
      ref={railRef}
      role="slider"
      tabIndex={0}
      aria-label="Scroll through the timeline by date"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={Math.round(maxScroll)}
      aria-valuenow={Math.round(scrollTop)}
      aria-valuetext={activeLabel ?? undefined}
      data-dragging={dragging ? "true" : undefined}
      className={cn("dr-virtualized-timeline-scrubber", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerLeave={() => {
        setHoverY(null)
        setHoverLabel(null)
      }}
      onKeyDown={handleKeyDown}
    >
      {ticks.map((tick) => (
        <div
          key={tick.bucketId}
          className="dr-virtualized-timeline-scrubber-tick"
          data-tick-kind={tick.kind}
          style={{ top: tick.y }}
        >
          {tick.label ? <span aria-hidden="true">{tick.label}</span> : null}
        </div>
      ))}
      <div
        aria-hidden="true"
        className="dr-virtualized-timeline-scrubber-bracket"
        style={{ top: caretY, height: bracketHeight }}
      />
      <div
        aria-hidden="true"
        className="dr-virtualized-timeline-scrubber-caret"
        style={{ top: caretY }}
      />
      {/* This label already serves as the drag bubble: the rail captures
          the pointer on pointerdown (below), so pointermove keeps firing
          and targeting the rail -- and therefore keeps updating hoverY /
          hoverLabel -- for the whole drag, even once the cursor leaves the
          rail's own bounding box. Confirmed in a real browser, not assumed.
          A second, caret-owned bubble would duplicate this one at nearly
          the same date and y, so the caret renders no text at all. */}
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
