import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { VirtualizedTimelineScrubber } from "./VirtualizedTimelineScrubber"
import { computeBucketLayout } from "./useBucketLayout"
import type { BucketGeometry, TimelineBucket } from "./types"

const geometry: BucketGeometry = {
  gap: 4,
  minTileWidth: 100,
  tileAspect: 1,
  headerHeight: 32,
  bucketSpacing: 16,
}

const buckets: TimelineBucket[] = [
  { id: "a", date: "2026-07-01", count: 8 },
  { id: "b", date: "2026-06-01", count: 3 },
]

// heights [252, 148], total 400
const layout = computeBucketLayout({
  buckets,
  contentWidth: 412,
  collapsedIds: new Set<string>(),
  geometry,
})

function renderScrubber(onScrubTo = vi.fn()) {
  const utils = render(
    <VirtualizedTimelineScrubber
      buckets={buckets}
      layout={layout}
      granularity="month"
      scrollTop={0}
      viewportHeight={200}
      railHeight={400}
      onScrubTo={onScrubTo}
    />,
  )
  const rail = screen.getByRole("slider")
  // jsdom returns an all-zero rect, so the rail's geometry is stubbed.
  vi.spyOn(rail, "getBoundingClientRect").mockReturnValue({
    top: 0,
    left: 0,
    right: 12,
    bottom: 400,
    width: 12,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  return { ...utils, rail, onScrubTo }
}

describe("VirtualizedTimelineScrubber", () => {
  it("exposes the current date as slider text", () => {
    renderScrubber()
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-valuetext",
      "July 2026",
    )
  })

  it("maps a click to a proportional scroll offset", () => {
    const { rail, onScrubTo } = renderScrubber()
    fireEvent.pointerDown(rail, { clientY: 200 })
    // Half way down a 400px rail over a 400px document, minus half a 200px
    // viewport, clamps the target to the middle of the scrollable range.
    expect(onScrubTo).toHaveBeenCalledWith(100)
  })

  it("keeps scrubbing while the pointer is down and stops after release", () => {
    const { rail, onScrubTo } = renderScrubber()
    fireEvent.pointerDown(rail, { clientY: 0 })
    fireEvent.pointerMove(rail, { clientY: 400 })
    expect(onScrubTo).toHaveBeenLastCalledWith(200)
    fireEvent.pointerUp(rail, { clientY: 400 })
    onScrubTo.mockClear()
    fireEvent.pointerMove(rail, { clientY: 0 })
    expect(onScrubTo).not.toHaveBeenCalled()
  })

  it("steps by bucket with the arrow keys", () => {
    const { rail, onScrubTo } = renderScrubber()
    fireEvent.keyDown(rail, { key: "ArrowDown" })
    expect(onScrubTo).toHaveBeenCalledWith(252)
  })

  it("pages by a year's worth of buckets", () => {
    const { rail, onScrubTo } = renderScrubber()
    // Both fixture buckets are in 2026, so a page is two buckets; stepping
    // past the end clamps to the last one.
    fireEvent.keyDown(rail, { key: "PageDown" })
    expect(onScrubTo).toHaveBeenCalledWith(252)
  })

  it("jumps to the ends with Home and End", () => {
    const { rail, onScrubTo } = renderScrubber()
    fireEvent.keyDown(rail, { key: "End" })
    // total 400 minus a 200px viewport
    expect(onScrubTo).toHaveBeenCalledWith(200)
    fireEvent.keyDown(rail, { key: "Home" })
    expect(onScrubTo).toHaveBeenLastCalledWith(0)
  })

  it("renders one labelled segment per bucket, sized to its share of total height", () => {
    const { container } = renderScrubber()
    expect(screen.getByText("July 2026")).toBeInTheDocument()
    expect(screen.getByText("June 2026")).toBeInTheDocument()
    const segments = container.querySelectorAll<HTMLElement>(
      ".dr-virtualized-timeline-scrubber-segment",
    )
    // heights [252, 148] of a 400 total: each segment's flex-grow is its
    // share, which is what makes the rail proportional to bucket size
    // rather than to bucket count.
    expect(segments[0]?.style.flexGrow).toBe(String(252 / 400))
    expect(segments[1]?.style.flexGrow).toBe(String(148 / 400))
  })
})
