/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { VirtualizedTimeline } from "./VirtualizedTimeline"
import type { TimelineBucket } from "./types"

interface Photo {
  id: string
}

function makeBucket(
  id: string,
  date: string,
  count: number,
): TimelineBucket<Photo> {
  return {
    id,
    date,
    count,
    items: Array.from({ length: count }, (_, index) => ({
      id: `${id}-${index}`,
    })),
  }
}

const buckets = [
  makeBucket("2026-07", "2026-07-01", 8),
  makeBucket("2026-06", "2026-06-01", 3),
]

beforeAll(() => {
  // jsdom implements neither, and the component measures width through the
  // former and viewport height through the latter.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return 412
    },
  })
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return 300
    },
  })
})

function timelineElement(
  props: Partial<React.ComponentProps<typeof VirtualizedTimeline<Photo>>> = {},
) {
  return (
    <VirtualizedTimeline<Photo>
      buckets={buckets}
      minTileWidth={100}
      gap={4}
      headerHeight={32}
      bucketSpacing={16}
      overscanPx={0}
      renderItem={({ item }) => <span data-testid={item.id}>{item.id}</span>}
      {...props}
    />
  )
}

function renderTimeline(
  props: Partial<React.ComponentProps<typeof VirtualizedTimeline<Photo>>> = {},
) {
  return render(timelineElement(props))
}

describe("VirtualizedTimeline", () => {
  it("renders a header per mounted bucket, labelled from its date", () => {
    renderTimeline()
    expect(screen.getByText("July 2026")).toBeInTheDocument()
    expect(screen.getByText("June 2026")).toBeInTheDocument()
  })

  it("labels buckets by the requested granularity", () => {
    // Both fixture buckets fall in 2026, and both mount in this viewport, so
    // year granularity legitimately produces two identical "2026" headers.
    renderTimeline({ granularity: "year" })
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0)
  })

  it("prefers an explicit bucket label", () => {
    renderTimeline({
      buckets: [{ ...buckets[0]!, label: "Last summer" }, buckets[1]!],
    })
    expect(screen.getByText("Last summer")).toBeInTheDocument()
  })

  it("sizes the scroll sizer to the computed total height", () => {
    const { container } = renderTimeline()
    const sizer = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-sizer",
    )
    // heights [252, 148] -> 400
    expect(sizer?.style.height).toBe("400px")
  })

  it("gives every bucket grid its full row and column counts, not the mounted subset", () => {
    renderTimeline()
    const grid = screen.getAllByRole("grid")[0]!
    expect(grid).toHaveAttribute("aria-colcount", "4")
    expect(grid).toHaveAttribute("aria-rowcount", "2")
  })

  it("names each bucket group after its header", () => {
    renderTimeline()
    const group = screen.getAllByRole("group")[0]!
    expect(group).toHaveAccessibleName("July 2026")
  })

  it("renders inline items through renderItem", () => {
    renderTimeline()
    expect(screen.getByTestId("2026-07-0")).toBeInTheDocument()
  })

  it("calls onItemClick with the item and its bucket", () => {
    const onItemClick = vi.fn()
    renderTimeline({ onItemClick })
    screen.getByTestId("2026-07-0").click()
    expect(onItemClick).toHaveBeenCalledWith(
      { id: "2026-07-0" },
      expect.objectContaining({ id: "2026-07" }),
    )
  })

  it("renders the empty state instead of a scroller when there are no buckets", () => {
    renderTimeline({ buckets: [], emptyState: <p>Nothing here</p> })
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
    expect(screen.queryByRole("grid")).not.toBeInTheDocument()
  })

  it("measures after buckets arrive following an initially empty mount", () => {
    const { rerender, container } = render(
      timelineElement({ buckets: [], emptyState: <p>Loading</p> }),
    )
    rerender(timelineElement({}))
    const sizer = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-sizer",
    )
    // An unmeasured mount (contentWidth stuck at 0) collapses to a single
    // column and a headers-only sizer height, so both a 400px sizer and a
    // 4-column grid prove the resize effect actually ran on this mount.
    expect(sizer?.style.height).toBe("400px")
    const grid = screen.getAllByRole("grid")[0]!
    expect(grid).toHaveAttribute("aria-colcount", "4")
  })

  it("throws when renderBucket is passed without getBucketHeight", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderTimeline({ renderBucket: () => <div /> })).toThrow(
      /getBucketHeight/,
    )
    error.mockRestore()
  })

  it("warns when the buckets are not sorted by date", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    renderTimeline({
      buckets: [
        makeBucket("2026-06", "2026-06-01", 2),
        makeBucket("2026-08", "2026-08-01", 2),
        makeBucket("2026-07", "2026-07-01", 2),
      ],
    })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("sorted by date"))
    warn.mockRestore()
  })
})
