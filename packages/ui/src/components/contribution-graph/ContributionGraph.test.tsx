import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import {
  ContributionGraph,
  type ContributionGraphCell,
} from "./ContributionGraph"

const data = [
  { date: "2026-07-20", value: 10 },
  { date: "2026-07-21", value: 1 },
]

/**
 * 2026-07-20 is a Monday, so a Sunday-start grid over 2026-07-20..2026-08-02
 * lays out as three week columns: week 0 has a null Sunday (2026-07-19 is
 * before the range), week 1 is complete, week 2 holds only 2026-08-02. Cells
 * are emitted row-major by weekday, so DOM order is NOT chronological — every
 * positional assertion below goes through `cellFor` instead of an index.
 */
function renderGraph(
  props: Partial<React.ComponentProps<typeof ContributionGraph>> = {},
) {
  return render(
    <ContributionGraph
      startDate="2026-07-20"
      endDate="2026-08-02"
      data={data}
      {...props}
    />,
  )
}

function cells(): HTMLElement[] {
  return screen.getAllByRole("gridcell")
}

function cellFor(date: string): HTMLElement {
  const cell = cells().find((c) => c.getAttribute("data-date") === date)
  if (!cell) throw new Error(`No cell rendered for ${date}`)
  return cell
}

describe("ContributionGraph", () => {
  it("renders a grid of seven weekday rows", () => {
    renderGraph()
    expect(screen.getByRole("grid")).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(7)
  })

  it("renders one cell per in-range day", () => {
    renderGraph()
    expect(cells()).toHaveLength(14)
  })

  it("sets data-level from the value", () => {
    renderGraph()
    expect(cellFor("2026-07-20")).toHaveAttribute("data-level", "4")
    expect(cellFor("2026-07-21")).toHaveAttribute("data-level", "1")
    expect(cellFor("2026-07-22")).toHaveAttribute("data-level", "0")
  })

  it("labels each cell with its value and date", () => {
    renderGraph()
    expect(cellFor("2026-07-20").getAttribute("aria-label")).toMatch(
      /10 contributions/,
    )
  })

  it("accepts a custom cell label", () => {
    renderGraph({ cellLabel: (cell) => `${cell.key}=${cell.value}` })
    expect(cellFor("2026-07-20")).toHaveAttribute("aria-label", "2026-07-20=10")
  })

  it("makes exactly one cell tabbable at rest", () => {
    renderGraph()
    const tabbable = cells().filter((c) => c.getAttribute("tabindex") === "0")
    expect(tabbable).toHaveLength(1)
    // The first in-range day is 2026-07-20 (2026-07-19 is padding), so it's
    // the cell the roving tabindex should land on before any focus/arrow.
    expect(tabbable[0]).toBe(cellFor("2026-07-20"))
  })

  it("keeps exactly one cell tabbable after the range changes while focused", () => {
    const { rerender } = renderGraph()
    const monday = cellFor("2026-07-20")
    monday.focus()
    expect(document.activeElement).toBe(monday)

    // 2026-01-06 is a Tuesday and the range is a single day, so the new
    // calendar has no cell at week 0 / weekday 1 (Monday) — the grid
    // position the old focus pointed at no longer exists.
    rerender(
      <ContributionGraph
        startDate="2026-01-06"
        endDate="2026-01-06"
        data={data}
      />,
    )
    const tabbable = cells().filter((c) => c.getAttribute("tabindex") === "0")
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(cellFor("2026-01-06"))
  })

  it("moves focus by a week with ArrowRight and by a day with ArrowDown", () => {
    renderGraph()
    const monday = cellFor("2026-07-20")
    monday.focus()
    fireEvent.keyDown(monday, { key: "ArrowRight" })
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-27")
    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "ArrowDown",
    })
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-28")
  })

  it("does not move focus past the edge of the grid", () => {
    renderGraph()
    // 2026-07-20 is in the first week column, so there is nowhere to go left.
    const monday = cellFor("2026-07-20")
    monday.focus()
    fireEvent.keyDown(monday, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(monday)
  })

  it("jumps to the row edges with Home and End", () => {
    renderGraph()
    const monday = cellFor("2026-07-20")
    monday.focus()
    fireEvent.keyDown(monday, { key: "End" })
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-27")
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" })
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-20")
  })

  it("does not move right past the last week column", () => {
    renderGraph()
    // 2026-08-02 is the sole cell in week 2, the last week column.
    const lastDay = cellFor("2026-08-02")
    lastDay.focus()
    fireEvent.keyDown(lastDay, { key: "ArrowRight" })
    expect(document.activeElement).toBe(lastDay)
  })

  it("does not move up past the top weekday row", () => {
    renderGraph()
    // 2026-07-26 is a Sunday, the top row (weekday index 0).
    const sunday = cellFor("2026-07-26")
    sunday.focus()
    fireEvent.keyDown(sunday, { key: "ArrowUp" })
    expect(document.activeElement).toBe(sunday)
  })

  it("does not move down past the bottom weekday row", () => {
    renderGraph()
    // 2026-08-01 is a Saturday, the bottom row (weekday index 6).
    const saturday = cellFor("2026-08-01")
    saturday.focus()
    fireEvent.keyDown(saturday, { key: "ArrowDown" })
    expect(document.activeElement).toBe(saturday)
  })

  it("Home skips a padding cell to reach the row's first real day", () => {
    renderGraph()
    // Weekday row 0 (Sunday) has a padding cell in week 0 (2026-07-19 is
    // before the range) — its first real day is week 1's 2026-07-26.
    const secondSunday = cellFor("2026-08-02")
    secondSunday.focus()
    fireEvent.keyDown(secondSunday, { key: "Home" })
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-26")
  })

  it("fires onCellClick for a click and for Enter", () => {
    const onCellClick = vi.fn()
    renderGraph({ onCellClick })
    const monday = cellFor("2026-07-20")
    fireEvent.click(monday)
    expect(onCellClick).toHaveBeenCalledTimes(1)
    const call = onCellClick.mock.calls[0]?.[0] as ContributionGraphCell
    expect(call.key).toBe("2026-07-20")
    fireEvent.keyDown(monday, { key: "Enter" })
    expect(onCellClick).toHaveBeenCalledTimes(2)
  })

  it("shows exactly one tooltip while a cell is hovered", () => {
    renderGraph()
    const monday = cellFor("2026-07-20")
    expect(screen.queryAllByRole("tooltip")).toHaveLength(0)
    fireEvent.pointerEnter(monday)
    expect(screen.getAllByRole("tooltip")).toHaveLength(1)
    fireEvent.pointerLeave(monday)
    expect(screen.queryAllByRole("tooltip")).toHaveLength(0)
  })

  it("flips the tooltip below a cell that has no headroom above it", () => {
    renderGraph()
    // 2026-07-26 is a Sunday, the top weekday row. Consumers wrap the graph
    // in `overflow-x-auto`, which clips block-start overflow, so a tooltip
    // placed above a top-row cell would render at zero visible height.
    fireEvent.pointerEnter(cellFor("2026-07-26"))
    expect(screen.getByRole("tooltip")).toHaveAttribute("data-side", "bottom")
  })

  it("keeps the tooltip above a cell with room for it", () => {
    renderGraph()
    const saturday = cellFor("2026-08-01")
    // jsdom performs no layout, so every offset* reads 0; stub the cell
    // measurement the side decision is made from (the tooltip's own
    // offsetHeight defaults to 0, which only makes "top" easier to reach).
    Object.defineProperty(saturday, "offsetTop", {
      value: 120,
      configurable: true,
    })
    fireEvent.pointerEnter(saturday)
    expect(screen.getByRole("tooltip")).toHaveAttribute("data-side", "top")
  })

  // The side is decided from the tooltip's own rendered height, measured in a
  // layout effect, rather than a fixed constant — a constant can't describe a
  // box that grows with the `fontSize` theme axis. jsdom performs no layout,
  // so it cannot demonstrate the actual clipping this fixes or produce a real
  // offsetHeight; these tests stub HTMLElement.prototype.offsetHeight to
  // prove the *decision logic* recomputes from the measured value and that
  // both the "top" and "bottom" branches are reachable from it. They are not
  // proof of the rendered geometry — that was, and remains, verified visually
  // in the running showcase at each font-size step.
  describe("tooltip side tracks the tooltip's measured height", () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it("flips to bottom once a taller measured box no longer clears the gap", () => {
      // Reproduces the reported defect: at the extra-large font-size step the
      // tooltip's box was measured at ~50px tall. A cell 37px from the top of
      // its container cleared the old fixed 32px constant (so it used to stay
      // "top" and clip in a scroll-clipping showcase wrapper), but does not
      // clear a 50px-tall box plus the 6px gap.
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(50)
      renderGraph()
      const cell = cellFor("2026-07-27")
      Object.defineProperty(cell, "offsetTop", {
        value: 37,
        configurable: true,
      })
      fireEvent.pointerEnter(cell)
      expect(screen.getByRole("tooltip")).toHaveAttribute("data-side", "bottom")
    })

    it("stays on top when a shorter measured box clears the gap", () => {
      // At the `small` font-size step the box is much shorter. A cell 25px
      // from the top is under the old fixed 32px constant (which would have
      // flipped it to "bottom" regardless of the box's real size), but
      // comfortably clears a 10px-tall tooltip plus the 6px gap.
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(10)
      renderGraph()
      const cell = cellFor("2026-07-28")
      Object.defineProperty(cell, "offsetTop", {
        value: 25,
        configurable: true,
      })
      fireEvent.pointerEnter(cell)
      expect(screen.getByRole("tooltip")).toHaveAttribute("data-side", "top")
    })
  })

  it("declares grid dimensions and one column index per week", () => {
    renderGraph()
    const grid = screen.getByRole("grid")
    expect(grid).toHaveAttribute("aria-colcount", "3")
    expect(grid).toHaveAttribute("aria-rowcount", "7")
    // Row 0 opens with a padding cell (2026-07-19 is before the range) and
    // row 1 does not, so without an explicit index the two rows' week-1 days
    // would sit at different column positions for a screen reader.
    expect(cellFor("2026-07-26")).toHaveAttribute("aria-colindex", "2")
    expect(cellFor("2026-07-27")).toHaveAttribute("aria-colindex", "2")
  })

  it("marks cells clickable only when onCellClick is provided", () => {
    const { rerender } = renderGraph()
    expect(cellFor("2026-07-20")).not.toHaveAttribute("data-clickable")
    rerender(
      <ContributionGraph
        startDate="2026-07-20"
        endDate="2026-08-02"
        data={data}
        onCellClick={() => {}}
      />,
    )
    expect(cellFor("2026-07-20")).toHaveAttribute("data-clickable", "true")
  })

  it("clears the tooltip when the focused cell blurs", () => {
    renderGraph()
    const monday = cellFor("2026-07-20")
    fireEvent.focus(monday)
    expect(screen.getAllByRole("tooltip")).toHaveLength(1)
    fireEvent.blur(monday)
    expect(screen.queryAllByRole("tooltip")).toHaveLength(0)
  })

  it("toggles the optional sections", () => {
    const { container, rerender } = renderGraph()
    expect(
      container.querySelector(".dr-contribution-graph-legend"),
    ).not.toBeNull()
    expect(
      container.querySelector(".dr-contribution-graph-months"),
    ).not.toBeNull()
    expect(
      container.querySelector(".dr-contribution-graph-weekdays"),
    ).not.toBeNull()

    rerender(
      <ContributionGraph
        startDate="2026-07-20"
        endDate="2026-08-02"
        data={data}
        showLegend={false}
        showMonthLabels={false}
        showWeekdayLabels={false}
      />,
    )
    expect(container.querySelector(".dr-contribution-graph-legend")).toBeNull()
    expect(container.querySelector(".dr-contribution-graph-months")).toBeNull()
    expect(
      container.querySelector(".dr-contribution-graph-weekdays"),
    ).toBeNull()
  })

  it("defaults to a trailing year ending today", () => {
    render(<ContributionGraph data={[]} />)
    expect(screen.getAllByRole("gridcell").length).toBeGreaterThan(360)
  })
})
