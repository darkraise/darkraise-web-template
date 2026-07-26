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

function renderScrubber(
  overrides: {
    onScrubTo?: ReturnType<typeof vi.fn>
    showLabels?: boolean
  } = {},
) {
  const onScrubTo = overrides.onScrubTo ?? vi.fn()
  const utils = render(
    <VirtualizedTimelineScrubber
      buckets={buckets}
      layout={layout}
      granularity="month"
      scrollTop={0}
      viewportHeight={200}
      railHeight={400}
      showLabels={overrides.showLabels ?? true}
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

  it("renders one absolutely positioned tick per bucket", () => {
    const { container } = renderScrubber()
    const ticks = container.querySelectorAll(
      ".dr-virtualized-timeline-scrubber-tick",
    )
    expect(ticks).toHaveLength(2)
  })

  it("places each tick at its proportional offset down the rail", () => {
    const { container } = renderScrubber()
    const ticks = container.querySelectorAll<HTMLElement>(
      ".dr-virtualized-timeline-scrubber-tick",
    )
    // heights [252, 148] over a 400 total on a 400px rail: offsets 0 and 252.
    expect(ticks[0]?.style.top).toBe("0px")
    expect(ticks[1]?.style.top).toBe("252px")
  })

  it("marks the year boundary distinctly from a month", () => {
    const { container } = renderScrubber()
    const ticks = container.querySelectorAll<HTMLElement>(
      ".dr-virtualized-timeline-scrubber-tick",
    )
    expect(ticks[0]?.dataset.tickKind).toBe("year")
    expect(ticks[1]?.dataset.tickKind).toBe("sub")
  })

  it("shows the year on the year tick and the short month on the other", () => {
    renderScrubber()
    expect(screen.getByText("2026")).toBeInTheDocument()
    expect(screen.getByText("Jun")).toBeInTheDocument()
  })

  it("keeps the ticks but drops every label when labels are off", () => {
    const { container } = renderScrubber({ showLabels: false })
    expect(
      container.querySelectorAll(".dr-virtualized-timeline-scrubber-tick"),
    ).toHaveLength(2)
    expect(screen.queryByText("2026")).not.toBeInTheDocument()
  })

  // The rail's whole inner DOM is being replaced in this task, so its slider
  // contract and the decorative status of everything inside it are exactly
  // what a rewrite loses silently.
  it("keeps its slider semantics through the rewrite", () => {
    const { rail } = renderScrubber()
    expect(rail).toHaveAttribute("role", "slider")
    expect(rail).toHaveAttribute("aria-orientation", "vertical")
    expect(rail).toHaveAttribute("aria-valuetext", "July 2026")
    const now = Number(rail.getAttribute("aria-valuenow"))
    const max = Number(rail.getAttribute("aria-valuemax"))
    const min = Number(rail.getAttribute("aria-valuemin"))
    // An earlier version of this scrubber rendered a valuenow above its own
    // valuemax, and the invalid state never resynced.
    expect(min).toBeLessThanOrEqual(now)
    expect(now).toBeLessThanOrEqual(max)
  })

  it("exposes ticks and labels as decorative, not as content", () => {
    const { container } = renderScrubber()
    const ticks = container.querySelectorAll(
      ".dr-virtualized-timeline-scrubber-tick",
    )
    // The dates already reach assistive technology through aria-valuetext;
    // announcing every tick as well would be noise.
    for (const tick of ticks) {
      const label = tick.querySelector("span")
      if (label) expect(label).toHaveAttribute("aria-hidden", "true")
    }
  })
})
