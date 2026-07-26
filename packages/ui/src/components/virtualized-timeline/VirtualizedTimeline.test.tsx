/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
    // Scoped to the header elements: the scrubber also renders each
    // bucket's label, so an unscoped text query would be ambiguous.
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
    // Scoped to the header: the scrubber also renders the label, which
    // would make an unscoped text query ambiguous.
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
    cells[0]!.focus()
    fireEvent.keyDown(cells[0]!, { key: "ArrowRight" })
    expect(document.activeElement).toBe(cells[1])
    fireEvent.keyDown(cells[1]!, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(cells[0])
  })

  it("moves focus a column with up and down", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    cells[0]!.focus()
    // 412px content width at 100px minimum tile width gives four columns.
    fireEvent.keyDown(cells[0]!, { key: "ArrowDown" })
    expect(document.activeElement).toBe(cells[4])
  })

  it("reaches the bucket edges with Home and End", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    cells[2]!.focus()
    fireEvent.keyDown(cells[2]!, { key: "End" })
    expect(document.activeElement).toBe(cells[7])
    fireEvent.keyDown(cells[7]!, { key: "Home" })
    expect(document.activeElement).toBe(cells[0])
  })

  it("crosses a bucket boundary", () => {
    renderTimeline()
    const cells = screen.getAllByRole("gridcell")
    cells[7]!.focus()
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute("data-item-id", "2026-06-0")
  })

  it("focuses the bucket header when the destination bucket has not loaded", async () => {
    renderTimeline({
      buckets: [buckets[0]!, { id: "2026-06", date: "2026-06-01", count: 3 }],
      loadBucket: () => new Promise<Photo[]>(() => {}),
    })
    const cells = screen.getAllByRole("gridcell")
    cells[7]!.focus()
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
    cells[0]!.focus()
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
    cells[7]!.focus()
    fireEvent.keyDown(cells[7]!, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute(
      "id",
      expect.stringContaining("header-2026-06"),
    )
    cells[0]!.focus()
    resolveItems([{ id: "z-0" }, { id: "z-1" }, { id: "z-2" }])
    await waitFor(() => expect(screen.getByTestId("z-0")).toBeInTheDocument())
    expect(document.activeElement).toBe(cells[0])
  })
})
