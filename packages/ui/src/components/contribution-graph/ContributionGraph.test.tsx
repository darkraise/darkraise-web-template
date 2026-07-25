import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
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
    expect(
      cells().filter((c) => c.getAttribute("tabindex") === "0"),
    ).toHaveLength(1)
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
