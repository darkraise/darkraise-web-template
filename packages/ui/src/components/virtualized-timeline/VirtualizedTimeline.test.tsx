/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { VirtualizedTimeline } from "./VirtualizedTimeline"
import type { VirtualizedTimelineHandle } from "./VirtualizedTimeline"
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
  // former and viewport height through the latter. jsdom applies none of the
  // component's CSS, so the rail's rendered width is fiction here — the
  // component reads the stub directly, with no subtraction. 412px is the
  // ledger's canonical content width: 4 columns of 100px tiles, so the
  // column count, tile size, and every expected value below are pinned to
  // this stub.
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

// The shared ResizeObserver stub above is inert (it never invokes its
// callback), so exercising a real width change needs a local stub that
// captures and can re-trigger it. Callers must invoke the returned
// `restore()` in a `finally` so later tests see the fixture's fixed 412px
// width again.
function stubResizableWidth() {
  let width = 412
  let onResize: (() => void) | null = null
  const inertResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        onResize = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return width
    },
  })
  return {
    setWidth: (next: number) => {
      width = next
    },
    resize: () => onResize?.(),
    restore: () => {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
          return 412
        },
      })
      vi.stubGlobal("ResizeObserver", inertResizeObserver)
    },
  }
}

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
    // Scoped to the header elements rather than an unscoped text query: at
    // this fixture's 412px width the scrubber renders no label text at all
    // (below the rail's label breakpoint), but the header elements are the
    // right source of truth for this assertion regardless.
    const { container } = renderTimeline()
    const headers = container.querySelectorAll(
      ".dr-virtualized-timeline-bucket-header",
    )
    expect(headers[0]).toHaveTextContent("July 2026")
    expect(headers[1]).toHaveTextContent("June 2026")
  })

  it("labels buckets by the requested granularity", () => {
    // Both fixture buckets fall in 2026, and both mount in this viewport, so
    // year granularity legitimately produces two identical "2026" headers.
    renderTimeline({ granularity: "year" })
    expect(screen.getAllByText("2026").length).toBeGreaterThan(0)
  })

  it("prefers an explicit bucket label", () => {
    // Scoped to the header rather than an unscoped text query: at this
    // fixture's 412px width the scrubber renders no label text at all
    // (below the rail's label breakpoint), but the header is the right
    // source of truth for this assertion regardless.
    const { container } = renderTimeline({
      buckets: [{ ...buckets[0]!, label: "Last summer" }, buckets[1]!],
    })
    const header = container.querySelector(
      ".dr-virtualized-timeline-bucket-header",
    )
    expect(header).toHaveTextContent("Last summer")
  })

  it("sizes the scroll sizer to the computed total height", () => {
    const { container } = renderTimeline()
    const sizer = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-sizer",
    )
    // heights [252, 148] -> 400
    expect(sizer?.style.height).toBe("400px")
  })

  it("sizes the sizer to every bucket, not just the mounted window", () => {
    // The 300px viewport at overscan 0 mounts only the first two buckets;
    // the third (1084px) must still be in the sizer's height.
    const { container } = render(
      timelineElement({
        buckets: [...buckets, makeBucket("2026-05", "2026-05-01", 40)],
      }),
    )
    const sizer = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-sizer",
    )
    expect(sizer?.style.height).toBe("1484px")
  })

  it("measures content width from the viewport, with no reserved subtraction", () => {
    const { container } = renderTimeline()
    const viewport = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-viewport",
    )
    const grid = screen.getAllByRole("grid")[0]
    // With the subtraction gone, the stubbed clientWidth IS the content
    // width, so the fixture stubs 412 directly: 4 columns, 100px tiles.
    expect(viewport).not.toBeNull()
    expect(grid).toHaveAttribute("aria-colcount", "4")
  })

  it("renders the rail as a sibling of the viewport, not inside it", () => {
    const { container } = renderTimeline()
    const viewport = container.querySelector(
      ".dr-virtualized-timeline-viewport",
    )
    const rail = container.querySelector(".dr-virtualized-timeline-scrubber")
    expect(rail).not.toBeNull()
    expect(viewport?.contains(rail!)).toBe(false)
    expect(rail?.parentElement).toBe(viewport?.parentElement)
  })

  it("renders no rail when there is nothing to scrub", () => {
    const { container } = renderTimeline({
      buckets: [makeBucket("2026-07", "2026-07-01", 1)],
    })
    // A single one-row bucket is shorter than the stubbed viewport, so
    // maxScroll is 0 and a date index would have no range to index.
    expect(
      container.querySelector(".dr-virtualized-timeline-scrubber"),
    ).toBeNull()
  })

  it("renders no rail when showScrubber is false, even with room to scrub", () => {
    // The two-bucket default fixture totals 400px against the 300px stubbed
    // viewport, so maxScroll is clearly positive here; showScrubber is the
    // only thing keeping the rail out.
    renderTimeline({ showScrubber: false })
    expect(screen.queryByRole("slider")).not.toBeInTheDocument()
  })

  it("shows tick labels once the scroll area crosses the label breakpoint", () => {
    // Widens the shared clientWidth stub for this test alone, then restores
    // it: the scroll-area ref this measures from is a plain HTMLElement, so
    // it reads the same stub every other element in the file does, and
    // leaving it widened would move the 412px column/tile fixtures other
    // tests depend on.
    const stub = stubResizableWidth()
    try {
      stub.setWidth(600)
      renderTimeline()
      expect(screen.getByText("2026")).toBeInTheDocument()
    } finally {
      stub.restore()
    }
  })

  it("keeps tick labels off below the label breakpoint", () => {
    // Counterpart of the test above: this fixture's default 412px stub sits
    // below the rail's label breakpoint, so no tick label ever reaches the
    // DOM through the real scroll-area measurement.
    renderTimeline()
    expect(screen.queryByText("2026")).not.toBeInTheDocument()
  })

  it("keeps the tile geometry variables under a consumer style prop", () => {
    const { container } = renderTimeline({ style: { height: 500 } })
    const root = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline",
    )!
    expect(root.style.height).toBe("500px")
    expect(root.style.getPropertyValue("--vtimeline-tile-width")).toBe("100px")
    expect(root.style.getPropertyValue("--vtimeline-tile-height")).toBe("100px")
  })

  it("gives every bucket grid its full row and column counts, not the mounted subset", () => {
    renderTimeline()
    const grid = screen.getAllByRole("grid")[0]!
    expect(grid).toHaveAttribute("aria-colcount", "4")
    expect(grid).toHaveAttribute("aria-rowcount", "2")
  })

  it("wraps every gridcell in a row numbered from the bucket's full grid", () => {
    renderTimeline()
    const grid = screen.getAllByRole("grid")[0]!
    const rows = within(grid).getAllByRole("row")
    // Bucket "2026-07" has 8 items over 4 columns: two full rows.
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveAttribute("aria-rowindex", "1")
    expect(rows[1]).toHaveAttribute("aria-rowindex", "2")
    expect(within(rows[0]!).getAllByRole("gridcell")).toHaveLength(4)
    // No gridcell may sit directly under the grid: aria-required-parent.
    for (const cell of within(grid).getAllByRole("gridcell")) {
      expect(cell.parentElement).toHaveAttribute("role", "row")
    }
    expect(within(grid).getAllByRole("gridcell")[0]).toHaveAttribute(
      "aria-colindex",
      "1",
    )
  })

  it("names each bucket group after its header", () => {
    renderTimeline()
    const group = screen.getAllByRole("group")[0]!
    expect(group).toHaveAccessibleName("July 2026")
  })

  it("keeps control labels out of the bucket group and grid names", () => {
    // With the checkbox and disclosure button in the header, a name taken
    // from the whole header div would read "Select July 2026 Collapse July
    // 2026 July 2026" and mutate between Collapse and Expand.
    renderTimeline({ selectable: true, collapsible: true })
    expect(screen.getAllByRole("group")[0]).toHaveAccessibleName("July 2026")
    expect(screen.getAllByRole("grid")[0]).toHaveAccessibleName("July 2026")
  })

  it("renders inline items through renderItem", () => {
    renderTimeline()
    expect(screen.getByTestId("2026-07-0")).toBeInTheDocument()
  })

  it("calls onItemClick with the item and its bucket", () => {
    const onItemClick = vi.fn()
    renderTimeline({ onItemClick })
    fireEvent.click(screen.getByTestId("2026-07-0"))
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

  it("renders skeletons at final positions while a bucket loads", async () => {
    const { container } = renderTimeline({
      buckets: [{ id: "2026-07", date: "2026-07-01", count: 8 }],
      loadBucket: () => new Promise<Photo[]>(() => {}),
    })
    const tiles = container.querySelectorAll(".dr-virtualized-timeline-tile")
    expect(tiles.length).toBeGreaterThan(0)
    expect(container.querySelector(".dr-skeleton")).toBeInTheDocument()
  })

  it("swaps skeletons for items once the load resolves", async () => {
    renderTimeline({
      buckets: [{ id: "2026-07", date: "2026-07-01", count: 2 }],
      loadBucket: async () => [{ id: "x-0" }, { id: "x-1" }],
    })
    expect(await screen.findByTestId("x-0")).toBeInTheDocument()
  })

  it("leaves short-array slots empty instead of spinning forever", async () => {
    const { container } = renderTimeline({
      buckets: [{ id: "2026-07", date: "2026-07-01", count: 8 }],
      loadBucket: async () => [{ id: "y-0" }, { id: "y-1" }, { id: "y-2" }],
    })
    expect(await screen.findByTestId("y-0")).toBeInTheDocument()
    expect(screen.getByTestId("y-1")).toBeInTheDocument()
    expect(screen.getByTestId("y-2")).toBeInTheDocument()
    expect(container.querySelector(".dr-skeleton")).not.toBeInTheDocument()
  })

  it("offers a retry when a bucket fails to load", async () => {
    renderTimeline({
      buckets: [{ id: "2026-07", date: "2026-07-01", count: 2 }],
      loadBucket: async () => {
        throw new Error("offline")
      },
    })
    expect(await screen.findByRole("alert")).toHaveTextContent("offline")
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
  })

  it("keeps the scrubber's reported value within its max after scrubbing past the end", () => {
    // jsdom performs no layout, so scrollTop is a plain, unclamped property
    // by default. A real scroll container clamps the assignment to its
    // scroll range; this stub reproduces that so the test can tell the
    // difference between reading back the DOM (correct) and trusting the
    // scrub target verbatim (stale, and never self-corrects here because
    // jsdom also never fires a "scroll" event on a property write).
    let scrollTopValue = 0
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return 400
      },
    })
    Object.defineProperty(HTMLElement.prototype, "scrollTop", {
      configurable: true,
      get() {
        return scrollTopValue
      },
      set(value: number) {
        const max = Math.max(0, this.scrollHeight - this.clientHeight)
        scrollTopValue = Math.min(Math.max(0, value), max)
      },
    })
    try {
      renderTimeline()
      const rail = screen.getByRole("slider")
      // Bucket 1's offset (252) exceeds maxScroll (400 total - 300
      // viewport = 100), the same trailing-bucket-shorter-than-viewport
      // case the scrubber's own step() test exercises.
      fireEvent.keyDown(rail, { key: "ArrowDown" })
      const valueNow = Number(rail.getAttribute("aria-valuenow"))
      const valueMax = Number(rail.getAttribute("aria-valuemax"))
      expect(valueNow).toBeLessThanOrEqual(valueMax)
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTop")
      Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight")
    }
  })

  it("marks the grid multi-selectable and each cell unselected by default", () => {
    renderTimeline({ selectable: true })
    expect(screen.getAllByRole("grid")[0]).toHaveAttribute(
      "aria-multiselectable",
      "true",
    )
    expect(screen.getAllByRole("gridcell")[0]).toHaveAttribute(
      "aria-selected",
      "false",
    )
  })

  it("selects on click instead of activating when selectable", () => {
    const onItemClick = vi.fn()
    const onSelectionChange = vi.fn()
    renderTimeline({ selectable: true, onItemClick, onSelectionChange })
    fireEvent.click(screen.getByTestId("2026-07-0"))
    expect(onSelectionChange).toHaveBeenCalledWith(["2026-07-0"])
    expect(onItemClick).not.toHaveBeenCalled()
  })

  it("extends a range on shift-click", () => {
    const onSelectionChange = vi.fn()
    renderTimeline({ selectable: true, onSelectionChange })
    fireEvent.click(screen.getByTestId("2026-07-0"))
    fireEvent.click(screen.getByTestId("2026-07-2"), { shiftKey: true })
    expect(onSelectionChange).toHaveBeenLastCalledWith([
      "2026-07-0",
      "2026-07-1",
      "2026-07-2",
    ])
  })

  it("selects a whole bucket from its header checkbox", () => {
    const onSelectionChange = vi.fn()
    renderTimeline({ selectable: true, onSelectionChange })
    fireEvent.click(screen.getAllByRole("checkbox")[0]!)
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      buckets[0]!.items!.map((item) => item.id),
    )
  })

  it("awaits the load before selecting an unloaded bucket, blocking the checkbox meanwhile", async () => {
    let resolveItems: (items: Photo[]) => void = () => {}
    const onSelectionChange = vi.fn()
    renderTimeline({
      selectable: true,
      onSelectionChange,
      buckets: [{ id: "2026-07", date: "2026-07-01", count: 2 }],
      loadBucket: () =>
        new Promise<Photo[]>((resolve) => {
          resolveItems = resolve
        }),
    })
    const checkbox = screen.getAllByRole("checkbox")[0]!
    fireEvent.click(checkbox)
    expect(checkbox).toBeDisabled()
    resolveItems([{ id: "x-0" }, { id: "x-1" }])
    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenCalledWith(["x-0", "x-1"]),
    )
    expect(checkbox).not.toBeDisabled()
  })

  it("keeps a second bucket's checkbox disabled while only it is pending", async () => {
    let resolveA: (items: Photo[]) => void = () => {}
    let resolveB: (items: Photo[]) => void = () => {}
    const onSelectionChange = vi.fn()
    renderTimeline({
      selectable: true,
      onSelectionChange,
      buckets: [
        { id: "2026-07", date: "2026-07-01", count: 2 },
        { id: "2026-06", date: "2026-06-01", count: 2 },
      ],
      loadBucket: (bucket) =>
        new Promise<Photo[]>((resolve) => {
          if (bucket.id === "2026-07") resolveA = resolve
          else resolveB = resolve
        }),
    })
    const [checkboxA, checkboxB] = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxA!)
    fireEvent.click(checkboxB!)
    expect(checkboxA).toBeDisabled()
    expect(checkboxB).toBeDisabled()
    resolveA([{ id: "a-0" }, { id: "a-1" }])
    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenCalledWith(["a-0", "a-1"]),
    )
    expect(checkboxA).not.toBeDisabled()
    expect(checkboxB).toBeDisabled()
    resolveB([{ id: "b-0" }, { id: "b-1" }])
    await waitFor(() => expect(checkboxB).not.toBeDisabled())
  })

  it("keeps selection changes committed while a bucket select awaits its load", async () => {
    let resolveItems: (items: Photo[]) => void = () => {}
    const onSelectionChange = vi.fn()
    renderTimeline({
      selectable: true,
      onSelectionChange,
      buckets: [
        makeBucket("2026-07", "2026-07-01", 3),
        { id: "2026-06", date: "2026-06-01", count: 2 },
      ],
      loadBucket: () =>
        new Promise<Photo[]>((resolve) => {
          resolveItems = resolve
        }),
    })
    // Start a whole-bucket select that must await the lazy bucket's load.
    fireEvent.click(screen.getAllByRole("checkbox")[1]!)
    // While that load is in flight, toggle an item in the loaded bucket.
    fireEvent.click(screen.getByTestId("2026-07-0"))
    expect(onSelectionChange).toHaveBeenLastCalledWith(["2026-07-0"])
    resolveItems([{ id: "x-0" }, { id: "x-1" }])
    // A bucket select resolved against its click-time selection would report
    // only its own ids, silently discarding the toggle above.
    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenLastCalledWith([
        "2026-07-0",
        "x-0",
        "x-1",
      ]),
    )
  })

  it("shows the header checkbox as indeterminate for a partial bucket", () => {
    renderTimeline({ selectable: true, defaultSelectedIds: ["2026-07-0"] })
    expect(screen.getAllByRole("checkbox")[0]).toHaveAttribute(
      "aria-checked",
      "mixed",
    )
  })

  it("activates on Enter and toggles on Space", () => {
    const onItemClick = vi.fn()
    const onSelectionChange = vi.fn()
    renderTimeline({ selectable: true, onItemClick, onSelectionChange })
    const cell = screen.getAllByRole("gridcell")[0]!
    fireEvent.keyDown(cell, { key: "Enter" })
    expect(onItemClick).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(cell, { key: " " })
    expect(onSelectionChange).toHaveBeenCalledWith(["2026-07-0"])
  })

  it("collapses a bucket to its header alone", () => {
    const { container } = renderTimeline({
      collapsible: true,
      defaultCollapsedIds: ["2026-07"],
    })
    const bucket = container.querySelector<HTMLElement>(
      '.dr-virtualized-timeline-bucket[data-index="0"]',
    )
    expect(bucket).toHaveAttribute("data-collapsed", "true")
    expect(bucket?.style.height).toBe("32px")
  })

  it("shrinks the total scroll height when a bucket collapses", () => {
    const { container } = renderTimeline({
      collapsible: true,
      defaultCollapsedIds: ["2026-07"],
    })
    // 252 + 148 becomes 32 + 148
    expect(
      container.querySelector<HTMLElement>(".dr-virtualized-timeline-sizer")
        ?.style.height,
    ).toBe("180px")
  })

  it("renders no items for a collapsed bucket", () => {
    renderTimeline({ collapsible: true, defaultCollapsedIds: ["2026-07"] })
    expect(screen.queryByTestId("2026-07-0")).not.toBeInTheDocument()
  })

  it("collapses a custom bucket body to its header and tells the body", () => {
    const { container } = renderTimeline({
      collapsible: true,
      defaultCollapsedIds: ["2026-07"],
      getBucketHeight: (bucket) => 32 + bucket.count * 10 + 16,
      renderBucket: ({ bucket, collapsed }) =>
        collapsed ? null : <div data-testid={`body-${bucket.id}`} />,
    })
    const bucket = container.querySelector<HTMLElement>(
      '.dr-virtualized-timeline-bucket[data-index="0"]',
    )
    expect(bucket?.style.height).toBe("32px")
    expect(screen.queryByTestId("body-2026-07")).not.toBeInTheDocument()
    expect(screen.getByTestId("body-2026-06")).toBeInTheDocument()
  })

  it("toggles from the disclosure button and reports the change", () => {
    const onCollapsedChange = vi.fn()
    renderTimeline({ collapsible: true, onCollapsedChange })
    fireEvent.click(screen.getAllByRole("button", { name: /collapse/i })[0]!)
    expect(onCollapsedChange).toHaveBeenCalledWith(["2026-07"])
  })

  // If this test ever hangs instead of failing, the cause is the controlled
  // `collapsedIds` identity-key memo regressing back to an inline
  // `Array.from(...).join(...)` (or similar) recomputed fresh every render:
  // `useControllableState`'s value-mirroring effect then loops forever on
  // the new array identity. That loop is a synchronous `act()` flush that
  // never yields the thread, so nothing in-process — not vitest's default
  // test timeout, not a `Promise.race`/`setTimeout` wrapper here — can ever
  // preempt it; only the CI runner's own wall-clock limit will. Confirmed by
  // deliberately reintroducing the bug and watching this exact test hang.
  it("stays responsive when a controlled collapsedIds gets a fresh equal array", () => {
    const { rerender } = renderTimeline({
      collapsible: true,
      collapsedIds: ["2026-07"],
    })
    expect(screen.queryByTestId("2026-07-0")).not.toBeInTheDocument()
    // A fresh array literal with identical contents is exactly the input a
    // naive `[...ids]` spread mishandles: its identity changes every render,
    // which loops `useControllableState`'s value-mirroring effect forever.
    rerender(timelineElement({ collapsible: true, collapsedIds: ["2026-07"] }))
    expect(screen.queryByTestId("2026-07-0")).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: /expand/i })[0]!)
  })

  it("passes real collapsed and selection state to renderBucketHeader", () => {
    renderTimeline({
      collapsible: true,
      defaultCollapsedIds: ["2026-07"],
      selectable: true,
      defaultSelectedIds: ["2026-07-0"],
      renderBucketHeader: ({ bucket, collapsed, selection }) => (
        <span data-testid={`header-state-${bucket.id}`}>
          {String(collapsed)}:{selection}
        </span>
      ),
    })
    expect(screen.getByTestId("header-state-2026-07")).toHaveTextContent(
      "true:some",
    )
    expect(screen.getByTestId("header-state-2026-06")).toHaveTextContent(
      "false:none",
    )
  })

  it("keeps exactly one tab stop across every mounted item", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    expect(cells.filter((cell) => cell.tabIndex === 0)).toHaveLength(1)
    expect(cells[0]).toHaveAttribute("tabindex", "0")
  })

  it("moves focus one item with left and right", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[0]!.focus())
    fireEvent.keyDown(cells[0]!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(cells[1])
    fireEvent.keyDown(cells[1]!, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(cells[0])
  })

  it("moves focus a column with up and down", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[0]!.focus())
    // 412px content width at 100px minimum tile width gives four columns.
    fireEvent.keyDown(cells[0]!, { key: "ArrowDown" })
    expect(document.activeElement).toBe(cells[4])
  })

  it("reaches the bucket edges with Home and End", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[2]!.focus())
    fireEvent.keyDown(cells[2]!, { key: "End" })
    expect(document.activeElement).toBe(cells[7])
    fireEvent.keyDown(cells[7]!, { key: "Home" })
    expect(document.activeElement).toBe(cells[0])
  })

  it("crosses a bucket boundary", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[7]!.focus())
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-06-0")
  })

  it("focuses the bucket header when the destination bucket has not loaded", async () => {
    renderTimeline({
      buckets: [buckets[0]!, { id: "2026-06", date: "2026-06-01", count: 3 }],
      loadBucket: () => new Promise<Photo[]>(() => {}),
    })
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[7]!.focus())
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute(
      "id",
      expect.stringContaining("header-2026-06"),
    )
  })

  it("scrolls an off-window End target into view before focusing it", () => {
    // 40 items over 4 columns is 10 rows; a 300px viewport mounts only the
    // first three, so End targets a cell that does not exist yet and must go
    // through the scroll-then-focus handoff.
    renderTimeline({ buckets: [makeBucket("2026-07", "2026-07-01", 40)] })
    const cells = screen.getAllByRole("gridcell")
    expect(screen.queryByTestId("2026-07-39")).not.toBeInTheDocument()
    act(() => cells[0]!.focus())
    fireEvent.keyDown(cells[0]!, { key: "End" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-07-39")
  })

  it("keeps a mounted tab stop when the active item scrolls out of the window", () => {
    renderTimeline()
    // ArrowDown on the scrubber rail scrolls to bucket 1's offset (252),
    // which unmounts bucket 0 and with it the cell holding the tab stop.
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" })
    const cells = screen.getAllByRole("gridcell")
    expect(cells.length).toBeGreaterThan(0)
    expect(cells.filter((cell) => cell.tabIndex === 0)).toHaveLength(1)
  })

  it("does not steal focus to a late-loading bucket after the user moves on", async () => {
    let resolveItems: (items: Photo[]) => void = () => {}
    renderTimeline({
      buckets: [buckets[0]!, { id: "2026-06", date: "2026-06-01", count: 3 }],
      loadBucket: () =>
        new Promise<Photo[]>((resolve) => {
          resolveItems = resolve
        }),
    })
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[7]!.focus())
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute(
      "id",
      expect.stringContaining("header-2026-06"),
    )
    act(() => cells[0]!.focus())
    resolveItems([{ id: "z-0" }, { id: "z-1" }, { id: "z-2" }])
    await waitFor(() => expect(screen.getByTestId("z-0")).toBeInTheDocument())
    expect(document.activeElement).toBe(cells[0])
  })

  it("keeps the focused cell mounted when it scrolls out of the window", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[0]!.focus())
    fireEvent.keyDown(cells[0]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-07-1")
    // Pinning must not double-render the cell while it is still in the window.
    expect(screen.getAllByRole("gridcell")).toHaveLength(11)
    // ArrowDown on the scrubber rail scrolls to bucket 1's offset (252), which
    // takes bucket 0 — and with it the focused cell — out of the window.
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-07-1")
    expect(document.activeElement).toHaveAttribute("tabindex", "0")
    const after = screen.getAllByRole("gridcell")
    expect(after.filter((cell) => cell.tabIndex === 0)).toHaveLength(1)
  })

  it("moves the roving tab stop with a load-resolve handoff", async () => {
    let resolveItems: (items: Photo[]) => void = () => {}
    renderTimeline({
      buckets: [buckets[0]!, { id: "2026-06", date: "2026-06-01", count: 3 }],
      loadBucket: () =>
        new Promise<Photo[]>((resolve) => {
          resolveItems = resolve
        }),
    })
    const cells = screen.getAllByRole("gridcell")
    act(() => cells[7]!.focus())
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    resolveItems([{ id: "z-0" }, { id: "z-1" }, { id: "z-2" }])
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("data-item-id", "z-0"),
    )
    expect(document.activeElement).toHaveAttribute("tabindex", "0")
  })

  it("skips a collapsed bucket's items when arrowing across it", () => {
    renderTimeline({
      collapsible: true,
      defaultCollapsedIds: ["2026-06"],
      buckets: [
        makeBucket("2026-07", "2026-07-01", 4),
        makeBucket("2026-06", "2026-06-01", 4),
        makeBucket("2026-05", "2026-05-01", 4),
      ],
    })
    const cells = screen.getAllByRole("gridcell")
    expect(cells).toHaveLength(8)
    act(() => cells[3]!.focus())
    fireEvent.keyDown(cells[3]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-05-0")
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-07-3")
  })

  it("lands on the next unloaded bucket in the key's direction, not the first anywhere", () => {
    renderTimeline({
      buckets: [
        { id: "2026-07", date: "2026-07-01", count: 4 },
        makeBucket("2026-06", "2026-06-01", 4),
        { id: "2026-05", date: "2026-05-01", count: 4 },
      ],
      loadBucket: () => new Promise<Photo[]>(() => {}),
    })
    const cells = screen.getAllByRole("gridcell")
    expect(cells).toHaveLength(4)
    act(() => cells[3]!.focus())
    // Bucket 0 is also unloaded; a directionless search would land there.
    fireEvent.keyDown(cells[3]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute(
      "id",
      expect.stringContaining("header-2026-05"),
    )
    act(() => cells[0]!.focus())
    fireEvent.keyDown(cells[0]!, { key: "ArrowLeft" })
    expect(document.activeElement).toHaveAttribute(
      "id",
      expect.stringContaining("header-2026-07"),
    )
  })

  it("shields the active bucket's items from eviction while focus parks there", async () => {
    // Two buckets of 12 items (3 rows, 356px each) so only one fits the
    // 300px viewport at a time; maxLoadedBuckets 1 makes eviction claim the
    // off-window bucket unless the active bucket is shielded.
    renderTimeline({
      maxLoadedBuckets: 1,
      loadBucket: async (bucket) =>
        Array.from({ length: bucket.count }, (_, index) => ({
          id: `${bucket.id}-item-${index}`,
        })),
      buckets: [
        { id: "2026-07", date: "2026-07-01", count: 12 },
        { id: "2026-06", date: "2026-06-01", count: 12 },
      ],
    })
    const first = await screen.findByTestId("2026-07-item-0")
    const cell = first.closest<HTMLElement>("[data-item-id]")!
    act(() => cell.focus())
    // Establish the active item through the keyboard so this test does not
    // depend on click-focus tracking.
    fireEvent.keyDown(cell, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute(
      "data-item-id",
      "2026-07-item-1",
    )
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" })
    await screen.findByTestId("2026-06-item-0")
    expect(screen.getByTestId("2026-07-item-1")).toBeInTheDocument()
    expect(document.activeElement).toHaveAttribute(
      "data-item-id",
      "2026-07-item-1",
    )
  })

  it("pins a cell focused by click when it scrolls out of the window", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    // jsdom does not focus on click, so replicate a real browser's click as
    // focus followed by the click event.
    act(() => cells[1]!.focus())
    fireEvent.click(cells[1]!)
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-07-1")
    expect(document.activeElement).toHaveAttribute("tabindex", "0")
  })

  // The two-bucket fixture totals 400px against a 300px viewport, so its whole
  // scrollable range is 100px and every scroll target would clamp to it. A third,
  // tall bucket gives the ref something to actually scroll to.
  const refBuckets = [...buckets, makeBucket("2026-05", "2026-05-01", 40)]

  it("scrolls to the bucket nearest a date through the ref", () => {
    const ref = React.createRef<VirtualizedTimelineHandle>()
    const { container } = renderTimeline({ ref, buckets: refBuckets })
    act(() => ref.current?.scrollToDate("2026-06-15"))
    const viewport = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-viewport",
    )
    expect(viewport?.scrollTop).toBe(252)
  })

  it("scrolls to a bucket by id", () => {
    const ref = React.createRef<VirtualizedTimelineHandle>()
    const { container } = renderTimeline({ ref, buckets: refBuckets })
    act(() => ref.current?.scrollToBucket("2026-06"))
    expect(
      container.querySelector<HTMLElement>(".dr-virtualized-timeline-viewport")
        ?.scrollTop,
    ).toBe(252)
  })

  it("clamps a scroll target to the scrollable range", () => {
    // jsdom's scrollTop is an unclamped plain property (see the identical
    // stub in "keeps the scrubber's reported value within its max" above);
    // this reproduces a real scroll container's clamping so the assertion
    // can tell a clamped assignment from an unclamped one.
    let scrollTopValue = 0
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return 400
      },
    })
    Object.defineProperty(HTMLElement.prototype, "scrollTop", {
      configurable: true,
      get() {
        return scrollTopValue
      },
      set(value: number) {
        const max = Math.max(0, this.scrollHeight - this.clientHeight)
        scrollTopValue = Math.min(Math.max(0, value), max)
      },
    })
    try {
      const ref = React.createRef<VirtualizedTimelineHandle>()
      const { container } = renderTimeline({ ref })
      act(() => ref.current?.scrollToBucket("2026-06"))
      // Two buckets total 400px in a 300px viewport: 100px is the whole range.
      expect(
        container.querySelector<HTMLElement>(
          ".dr-virtualized-timeline-viewport",
        )?.scrollTop,
      ).toBe(100)
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTop")
      Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight")
    }
  })

  it("reports the visible bucket ids", () => {
    const ref = React.createRef<VirtualizedTimelineHandle>()
    renderTimeline({ ref, buckets: refBuckets })
    expect(ref.current?.getVisibleBucketIds()).toEqual(["2026-07", "2026-06"])
  })

  it("reports only intersecting buckets, not the overscanned mount window", () => {
    const ref = React.createRef<VirtualizedTimelineHandle>()
    renderTimeline({ ref, buckets: refBuckets, overscanPx: 600 })
    // The mount window's bottom edge is 0 + 300 + 600 = 900, which mounts
    // "2026-05" (offset 400) — but the 300px viewport ends at 300, so only
    // the first two buckets are actually in view.
    expect(screen.getByTestId("2026-05-0")).toBeInTheDocument()
    expect(ref.current?.getVisibleBucketIds()).toEqual(["2026-07", "2026-06"])
  })

  it("renders no toolbar unless jump-to-date is enabled", () => {
    const { container } = renderTimeline()
    expect(
      container.querySelector(".dr-virtualized-timeline-toolbar"),
    ).not.toBeInTheDocument()
  })

  it("renders the jump-to-date trigger in a toolbar when enabled", () => {
    renderTimeline({ showJumpToDate: true })
    expect(
      screen.getByRole("button", { name: "Jump to date" }),
    ).toBeInTheDocument()
    // No text input: without a parser it would be read-only, silently
    // refusing every keystroke — a broken affordance.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("keeps the scrubber's positioning parent from also holding the toolbar", () => {
    // jsdom has no layout engine, so it cannot see the scroll area's flex row
    // (viewport plus rail) actually reflowing if the toolbar shared it. What
    // it can see is the DOM shape that causes it: the scroll area (the
    // scrubber's parent, since nothing sits between them) must not be an
    // ancestor of the toolbar too, or the toolbar would compete with the
    // rail for space in the same flex row instead of sitting in its own band
    // above it.
    const { container } = renderTimeline({
      showScrubber: true,
      showJumpToDate: true,
    })
    const toolbar = container.querySelector(".dr-virtualized-timeline-toolbar")
    const scrubber = screen.getByRole("slider")
    expect(toolbar).toBeInTheDocument()
    expect(scrubber.parentElement?.contains(toolbar)).toBe(false)
  })

  it("restores reading position instead of the raw pixel offset after a resize", () => {
    const stub = stubResizableWidth()
    try {
      const ref = React.createRef<VirtualizedTimelineHandle>()
      const { container } = renderTimeline({ ref, buckets: refBuckets })
      const viewport = container.querySelector<HTMLElement>(
        ".dr-virtualized-timeline-viewport",
      )!
      act(() => ref.current?.scrollToBucket("2026-05"))
      expect(viewport.scrollTop).toBe(400)
      stub.setWidth(300)
      act(() => stub.resize())
      // 300px content width regroups to 2 columns; "2026-05" now starts at
      // 1000, and the reader should still be at its top edge rather than
      // still at 400, its old offset under the 4-column layout.
      expect(viewport.scrollTop).toBe(1000)
    } finally {
      stub.restore()
    }
  })

  it("keeps the right bucket anchored across a collapse then a resize", () => {
    const stub = stubResizableWidth()
    try {
      const ref = React.createRef<VirtualizedTimelineHandle>()
      const { container } = renderTimeline({
        ref,
        buckets: refBuckets,
        collapsible: true,
      })
      const viewport = container.querySelector<HTMLElement>(
        ".dr-virtualized-timeline-viewport",
      )!
      // Collapsing "2026-07" (index 0) shrinks it from 252px to its 32px
      // header, changing every later bucket's offset without changing
      // width — an anchor keyed on width alone would never see this.
      fireEvent.click(screen.getAllByRole("button", { name: /collapse/i })[0]!)
      act(() => ref.current?.scrollToBucket("2026-05"))
      expect(viewport.scrollTop).toBe(180)
      stub.setWidth(300)
      act(() => stub.resize())
      // "2026-05" starts at 380 under the collapsed, 2-column layout. A
      // stale anchor recorded against the pre-collapse layout would instead
      // restore near the very top of the document, inside "2026-07"'s old,
      // uncollapsed span.
      expect(viewport.scrollTop).toBe(380)
    } finally {
      stub.restore()
    }
  })

  it("anchors against the pre-resize layout even when the DOM clamps scrollTop", () => {
    // The two earlier anchoring tests pass with jsdom's plain, unclamped
    // scrollTop. A real browser re-clamps scrollTop the moment the sizer
    // shrinks — inside the very commit whose effects run next — so an anchor
    // captured anywhere in that commit reads the clamped value and lands at
    // roughly newTotal/oldTotal of the content. This stub reproduces the
    // clamp by deriving the scroll range from the sizer's live height.
    let scrollTopValue = 0
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        const sizer = (this as HTMLElement).querySelector<HTMLElement>(
          ".dr-virtualized-timeline-sizer",
        )
        return sizer ? parseFloat(sizer.style.height) || 0 : 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, "scrollTop", {
      configurable: true,
      get() {
        const max = Math.max(0, this.scrollHeight - this.clientHeight)
        return Math.min(scrollTopValue, max)
      },
      set(value: number) {
        const max = Math.max(0, this.scrollHeight - this.clientHeight)
        scrollTopValue = Math.min(Math.max(0, value), max)
      },
    })
    const stub = stubResizableWidth()
    try {
      stub.setWidth(300)
      const { container } = renderTimeline({ buckets: refBuckets })
      const viewport = container.querySelector<HTMLElement>(
        ".dr-virtualized-timeline-viewport",
      )!
      // 300px content width gives 2 columns: heights [652, 348, 3084],
      // offsets [0, 652, 1000], total 4084. 2542 is halfway into "2026-05".
      viewport.scrollTop = 2542
      expect(viewport.scrollTop).toBe(2542)
      stub.setWidth(412)
      act(() => stub.resize())
      // 412px regroups to 4 columns: offsets [0, 252, 400], heights
      // [252, 148, 1084], total 1484. Halfway into "2026-05" is
      // 400 + 0.5 * 1084 = 942. An anchor captured after the commit reads a
      // scrollTop already clamped to the new 1184 max and restores near the
      // top of "2026-05" instead.
      expect(viewport.scrollTop).toBe(942)
    } finally {
      stub.restore()
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTop")
      Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight")
    }
  })

  it("jumps to today without a consumer ref, closing over the handle", async () => {
    // Fixture dates are pinned safely in the past so "today," whatever the
    // real system date is, is always closer to "2020-02" than "2020-01" —
    // deterministic without mocking the clock.
    const user = userEvent.setup()
    const pastBuckets = [
      makeBucket("2020-01", "2020-01-01", 3),
      makeBucket("2020-02", "2020-02-01", 8),
    ]
    const { container } = renderTimeline({
      showJumpToDate: true,
      buckets: pastBuckets,
    })
    const viewport = container.querySelector<HTMLElement>(
      ".dr-virtualized-timeline-viewport",
    )!
    viewport.scrollTop = 999
    await user.click(screen.getByRole("button", { name: /jump to date/i }))
    const dialog = await screen.findByRole("dialog")
    const today = within(dialog).getByRole("button", { current: "date" })
    await user.click(today)
    // "2020-02" (the more recent fixture bucket) is always the nearer
    // bucket to today on any real calendar date after February 2020; its
    // offset is 148 (bucket "2020-01" is 3 items over 4 columns: one row,
    // 148px tall).
    await waitFor(() => expect(viewport.scrollTop).toBe(148))
  })
})
