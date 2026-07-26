"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import type { AccentHue } from "@lib/accent-hues"
import {
  addDays,
  buildCalendar,
  toDate,
  type ContributionGraphCell,
  type ContributionGraphDatum,
} from "./buildCalendar"
import "./contribution-graph.css"

export type {
  ContributionGraphCell,
  ContributionGraphDatum,
} from "./buildCalendar"

export type ContributionGraphSize = "sm" | "md" | "lg"

export type ContributionGraphVariant = "default" | AccentHue

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Rows 1, 3, and 5 only: a label on all seven rows does not fit the cell
 *  height, and every calendar heatmap in the wild labels alternate rows. */
const LABELLED_ROWS = [1, 3, 5]

/**
 * Fixed clearance, in px, between the tooltip box and the cell it points at
 * — the `0.375rem` gap baked into the CSS `transform: translate()` on both
 * `data-side` variants. Unlike the tooltip's own height, this gap does not
 * scale with the `fontSize` theme axis (that axis only re-binds `--text-*`
 * and the icon/control scales, never the root rem unit this gap is in), so
 * a plain constant is safe here. The height it used to be bundled with is
 * not: see the layout effect below.
 */
const TOOLTIP_GAP_PX = 6

function cellId(cell: ContributionGraphCell): string {
  return `${cell.weekIndex}:${cell.dayIndex}`
}

function defaultCellLabel(cell: ContributionGraphCell): string {
  const count =
    cell.value === 1 ? "1 contribution" : `${cell.value} contributions`
  const date = cell.date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  return `${count} on ${date}`
}

export interface ContributionGraphProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ContributionGraphDatum[]
  size?: ContributionGraphSize
  variant?: ContributionGraphVariant
  /** Defaults to `endDate` minus one year plus one day. */
  startDate?: Date | string
  /** Defaults to today. */
  endDate?: Date | string
  /** 0 = Sunday (default) through 6 = Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Number of non-empty intensity levels. Default 4. */
  levels?: number
  /** Ascending lower bounds for levels 1..levels. Defaults to quartiles of
   *  the maximum value among the rendered days — data outside the range does
   *  not move the ramp — with the first bound pinned at 1. */
  thresholds?: number[]
  showMonthLabels?: boolean
  showWeekdayLabels?: boolean
  showLegend?: boolean
  onCellClick?: (cell: ContributionGraphCell) => void
  cellLabel?: (cell: ContributionGraphCell) => string
}

function ContributionGraph({
  className,
  data,
  size = "md",
  variant = "default",
  startDate,
  endDate,
  weekStartsOn = 0,
  levels = 4,
  thresholds,
  showMonthLabels = true,
  showWeekdayLabels = true,
  showLegend = true,
  onCellClick,
  cellLabel = defaultCellLabel,
  "aria-label": ariaLabel = "Contribution activity",
  ...props
}: ContributionGraphProps) {
  const calendar = React.useMemo(() => {
    const end = endDate ? toDate(endDate) : new Date()
    const start = startDate ? toDate(startDate) : addDays(end, -364)
    const values = new Map(data.map((datum) => [datum.date, datum.value]))
    return buildCalendar({
      startDate: start,
      endDate: end,
      weekStartsOn,
      values,
      levels,
      thresholds,
    })
  }, [data, startDate, endDate, weekStartsOn, levels, thresholds])

  const cellRefs = React.useRef(new Map<string, HTMLDivElement>())
  const [focusedId, setFocusedId] = React.useState<string | null>(null)
  const [hovered, setHovered] = React.useState<{
    cell: ContributionGraphCell
    left: number
    top: number
    side: "top" | "bottom"
  } | null>(null)
  const tooltipRef = React.useRef<HTMLDivElement | null>(null)
  // Last measured tooltip height, reused only as the next hover's initial
  // guess (see showTooltip below) — never the final answer.
  const tooltipHeightRef = React.useRef(0)

  const firstCellId = React.useMemo(() => {
    const cell = calendar.weeks
      .flat()
      .find((candidate): candidate is ContributionGraphCell =>
        Boolean(candidate),
      )
    return cell ? cellId(cell) : null
  }, [calendar])

  // `calendar` is rebuilt whenever the date range or bucketing options
  // change, so a previously focused week/day position may no longer exist.
  // Validating against the current calendar (rather than trusting whatever
  // `focusedId` was set to) keeps exactly one cell tabbable even after the
  // grid reshapes out from under the focused cell.
  const validCellIds = React.useMemo(
    () =>
      new Set(
        calendar.weeks
          .flat()
          .filter((cell): cell is ContributionGraphCell => Boolean(cell))
          .map(cellId),
      ),
    [calendar],
  )

  const activeId =
    focusedId !== null && validCellIds.has(focusedId) ? focusedId : firstCellId

  const focusCell = React.useCallback((cell: ContributionGraphCell) => {
    const id = cellId(cell)
    setFocusedId(id)
    cellRefs.current.get(id)?.focus()
  }, [])

  const moveFocus = React.useCallback(
    (from: ContributionGraphCell, weekDelta: number, dayDelta: number) => {
      const target =
        calendar.weeks[from.weekIndex + weekDelta]?.[from.dayIndex + dayDelta]
      if (target) focusCell(target)
    },
    [calendar, focusCell],
  )

  const focusRowEdge = React.useCallback(
    (dayIndex: number, edge: "first" | "last") => {
      const row = calendar.weeks
        .map((week) => week[dayIndex])
        .filter((cell): cell is ContributionGraphCell => Boolean(cell))
      const target = edge === "first" ? row[0] : row[row.length - 1]
      if (target) focusCell(target)
    },
    [calendar, focusCell],
  )

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    cell: ContributionGraphCell,
  ) {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault()
        moveFocus(cell, -1, 0)
        return
      case "ArrowRight":
        event.preventDefault()
        moveFocus(cell, 1, 0)
        return
      case "ArrowUp":
        event.preventDefault()
        moveFocus(cell, 0, -1)
        return
      case "ArrowDown":
        event.preventDefault()
        moveFocus(cell, 0, 1)
        return
      case "Home":
        event.preventDefault()
        focusRowEdge(cell.dayIndex, "first")
        return
      case "End":
        event.preventDefault()
        focusRowEdge(cell.dayIndex, "last")
        return
      case "Enter":
      case " ":
        event.preventDefault()
        onCellClick?.(cell)
        return
      default:
        return
    }
  }

  function showTooltip(
    element: HTMLDivElement,
    cell: ContributionGraphCell,
  ): void {
    const top = element.offsetTop
    setHovered({
      cell,
      left: element.offsetLeft,
      top,
      // Provisional: guessed from the previous tooltip's measured height
      // (0 before any tooltip has ever rendered). The layout effect below
      // corrects this against the real box before the browser paints, so a
      // wrong guess here never becomes visible.
      side: top < tooltipHeightRef.current + TOOLTIP_GAP_PX ? "bottom" : "top",
    })
  }

  // A fixed pixel threshold can't describe a box whose height depends on the
  // `fontSize` theme axis (it scales the tooltip's own text). Measuring the
  // rendered tooltip directly, in a layout effect that runs after the commit
  // but before paint, lets the decision track the real geometry instead —
  // and any correction it makes is invisible, since nothing has painted yet.
  //
  // Flipping only changes the tooltip's `transform`, never its height, so
  // re-running this effect after a flip always reconfirms the same side.
  // State is only written when the side actually needs to change, which
  // both avoids an unnecessary re-render and guarantees this settles even if
  // that height-is-transform-invariant assumption ever stops holding.
  React.useLayoutEffect(() => {
    if (!hovered || !tooltipRef.current) return
    tooltipHeightRef.current = tooltipRef.current.offsetHeight
    const side: "top" | "bottom" =
      hovered.top < tooltipHeightRef.current + TOOLTIP_GAP_PX ? "bottom" : "top"
    if (side === hovered.side) return
    setHovered((prev) =>
      prev && prev.side !== side ? { ...prev, side } : prev,
    )
  }, [hovered])

  return (
    <div
      className={cn("dr-contribution-graph", className)}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {/* Months, weekday gutter, and the grid share one 2×2 CSS grid, so the
          month labels stay aligned with their week columns without any magic
          offset. The spacing that separates an optional section from the grid
          lives on that section as a margin, not on the grid's `gap` — see the
          track note in contribution-graph.css. */}
      <div className="dr-contribution-graph-body">
        {showMonthLabels ? (
          <div
            className="dr-contribution-graph-months"
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${calendar.weeks.length}, var(--contrib-cell-size))`,
            }}
          >
            {calendar.monthLabels.map((month) => (
              <span
                key={`${month.label}-${month.weekIndex}`}
                style={{
                  gridColumnStart: month.weekIndex + 1,
                  gridColumnEnd: `span ${month.span}`,
                }}
              >
                {month.label}
              </span>
            ))}
          </div>
        ) : null}

        {showWeekdayLabels ? (
          <div className="dr-contribution-graph-weekdays" aria-hidden="true">
            {Array.from({ length: 7 }, (_, row) => (
              <span key={row}>
                {LABELLED_ROWS.includes(row)
                  ? WEEKDAY_NAMES[(weekStartsOn + row) % 7]
                  : null}
              </span>
            ))}
          </div>
        ) : null}

        {/* Padding cells are `aria-hidden`, so rows expose different numbers
            of cells and a screen reader's column navigation would drift out
            of alignment between rows. Declaring the true column count and an
            explicit `aria-colindex` per cell keeps each week column addressable
            at the same index in every row. */}
        <div
          className="dr-contribution-graph-grid"
          role="grid"
          aria-label={ariaLabel}
          aria-colcount={calendar.weeks.length}
          aria-rowcount={7}
        >
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <div
              key={dayIndex}
              className="dr-contribution-graph-row"
              role="row"
            >
              {calendar.weeks.map((week, weekIndex) => {
                const cell = week[dayIndex]
                if (!cell) {
                  return (
                    <div
                      key={weekIndex}
                      className="dr-contribution-graph-cell"
                      data-empty="true"
                      aria-hidden="true"
                    />
                  )
                }
                const id = cellId(cell)
                return (
                  <div
                    key={weekIndex}
                    ref={(node) => {
                      if (node) cellRefs.current.set(id, node)
                      else cellRefs.current.delete(id)
                    }}
                    role="gridcell"
                    aria-colindex={cell.weekIndex + 1}
                    tabIndex={id === activeId ? 0 : -1}
                    data-level={cell.level}
                    data-date={cell.key}
                    data-clickable={onCellClick ? "true" : undefined}
                    aria-label={cellLabel(cell)}
                    className="dr-contribution-graph-cell focus-ring-tight"
                    onKeyDown={(event) => handleKeyDown(event, cell)}
                    onClick={() => onCellClick?.(cell)}
                    onPointerEnter={(event) =>
                      showTooltip(event.currentTarget, cell)
                    }
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(event) => {
                      setFocusedId(id)
                      showTooltip(event.currentTarget, cell)
                    }}
                    onBlur={() => setHovered(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {hovered ? (
          <div
            ref={tooltipRef}
            role="tooltip"
            className="dr-contribution-graph-tooltip"
            data-side={hovered.side}
            style={{ left: hovered.left, top: hovered.top }}
          >
            {cellLabel(hovered.cell)}
          </div>
        ) : null}
      </div>

      {showLegend ? (
        <div className="dr-contribution-graph-legend">
          <span>Less</span>
          {Array.from({ length: levels + 1 }, (_, level) => (
            <span
              key={level}
              className="dr-contribution-graph-cell"
              data-level={level}
              aria-hidden="true"
            />
          ))}
          <span>More</span>
        </div>
      ) : null}
    </div>
  )
}

export { ContributionGraph }
