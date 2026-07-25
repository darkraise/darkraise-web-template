import { describe, it, expect } from "vitest"
import {
  addDays,
  buildCalendar,
  defaultThresholds,
  levelFor,
  parseISODate,
  toDate,
  toISODateKey,
} from "./buildCalendar"
import type {
  ContributionGraphCell,
  ContributionGraphMonthLabel,
} from "./buildCalendar"

function calendarFor(
  start: string,
  end: string,
  entries: Record<string, number> = {},
  overrides: {
    weekStartsOn?: number
    levels?: number
    thresholds?: number[]
  } = {},
) {
  return buildCalendar({
    startDate: parseISODate(start),
    endDate: parseISODate(end),
    weekStartsOn: overrides.weekStartsOn ?? 0,
    values: new Map(Object.entries(entries)),
    levels: overrides.levels ?? 4,
    thresholds: overrides.thresholds,
  })
}

describe("parseISODate", () => {
  it("parses as a local date, not UTC", () => {
    const date = parseISODate("2026-07-24")
    // A UTC parse ("2026-07-24T00:00:00Z") and a local parse are the same
    // instant only at UTC+0 — at every other offset they differ by exactly
    // the offset, so getTime() is the assertion that can actually fail.
    // getFullYear/getMonth/getDate can both read back "24" even from a
    // UTC-parsed instant, depending on which side of Greenwich the runner
    // is on, so they cannot be trusted alone to catch a regression here.
    expect(date.getTime()).toBe(new Date(2026, 6, 24).getTime())
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(24)
  })

  it("round-trips through toISODateKey", () => {
    const parsed = parseISODate("2026-01-05")
    // Same reasoning as above: pin the parsed instant down first so this
    // test cannot pass merely because the runner's offset happens to mask
    // a UTC-parse regression.
    expect(parsed.getTime()).toBe(new Date(2026, 0, 5).getTime())
    expect(toISODateKey(parsed)).toBe("2026-01-05")
  })

  it("rejects a malformed date", () => {
    expect(() => parseISODate("24/07/2026")).toThrow(/YYYY-MM-DD/)
  })
})

describe("toDate", () => {
  it("parses a string input the same way parseISODate does", () => {
    // Compared against a directly-constructed local date rather than
    // parseISODate's own output, so this cannot pass by both sides sharing
    // the same regression.
    expect(toDate("2026-07-24").getTime()).toBe(new Date(2026, 6, 24).getTime())
  })

  it("normalizes a Date input to local midnight", () => {
    const withTime = new Date(2026, 6, 24, 15, 30, 45)
    const normalized = toDate(withTime)
    expect(normalized.getFullYear()).toBe(2026)
    expect(normalized.getMonth()).toBe(6)
    expect(normalized.getDate()).toBe(24)
    expect(normalized.getHours()).toBe(0)
    expect(normalized.getMinutes()).toBe(0)
    expect(normalized.getSeconds()).toBe(0)
  })
})

describe("addDays", () => {
  it("adds days and crosses a month boundary", () => {
    const result = addDays(parseISODate("2026-01-31"), 1)
    expect(toISODateKey(result)).toBe("2026-02-01")
  })

  it("does not mutate the input date", () => {
    const original = parseISODate("2026-07-24")
    const originalTime = original.getTime()
    addDays(original, 5)
    expect(original.getTime()).toBe(originalTime)
  })
})

describe("levels", () => {
  it("puts the first bound at 1 so a single contribution is never empty", () => {
    expect(defaultThresholds(10, 4)).toEqual([1, 5, 8, 10])
  })

  it("maps zero to level 0 and any positive value to at least level 1", () => {
    const thresholds = defaultThresholds(10, 4)
    expect(levelFor(0, thresholds)).toBe(0)
    expect(levelFor(1, thresholds)).toBe(1)
    expect(levelFor(4, thresholds)).toBe(1)
    expect(levelFor(5, thresholds)).toBe(2)
    expect(levelFor(9, thresholds)).toBe(3)
    expect(levelFor(10, thresholds)).toBe(4)
  })

  it("never returns a negative level", () => {
    expect(levelFor(-3, defaultThresholds(10, 4))).toBe(0)
  })

  it("honours explicit thresholds", () => {
    expect(levelFor(3, [1, 3, 6, 9])).toBe(2)
    expect(levelFor(9, [1, 3, 6, 9])).toBe(4)
  })
})

describe("buildCalendar", () => {
  it("pads every week to seven slots", () => {
    // 2026-07-24 is a Friday, so a Sunday-start grid pads four leading days.
    const calendar = calendarFor("2026-07-24", "2026-07-28")
    for (const week of calendar.weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it("pads days before the start and after the end with null", () => {
    const calendar = calendarFor("2026-07-24", "2026-07-25")
    const [firstWeek] = calendar.weeks
    const week = firstWeek as (ContributionGraphCell | null)[]
    expect(week.slice(0, 5)).toEqual([null, null, null, null, null])
    expect(week[5]).not.toBeNull()
    expect(week[6]).not.toBeNull()
  })

  it("shifts which weekday occupies row 0 for weekStartsOn", () => {
    const sundayStart = calendarFor("2026-07-20", "2026-07-26")
    const mondayStart = calendarFor(
      "2026-07-20",
      "2026-07-26",
      {},
      { weekStartsOn: 1 },
    )
    const [sundayWeek0] = sundayStart.weeks
    const [mondayWeek0] = mondayStart.weeks
    const sundayRow = sundayWeek0 as (ContributionGraphCell | null)[]
    const mondayRow = mondayWeek0 as (ContributionGraphCell | null)[]
    // 2026-07-20 is a Monday.
    expect(sundayRow[0]).toBeNull()
    expect((sundayRow[1] as ContributionGraphCell).key).toBe("2026-07-20")
    expect((mondayRow[0] as ContributionGraphCell).key).toBe("2026-07-20")
  })

  it("produces 53 or 54 week columns for a trailing year", () => {
    const calendar = calendarFor("2025-07-25", "2026-07-24")
    expect(calendar.weeks.length).toBeGreaterThanOrEqual(53)
    expect(calendar.weeks.length).toBeLessThanOrEqual(54)
  })

  it("attaches values and levels to the matching day", () => {
    const calendar = calendarFor("2026-07-20", "2026-07-26", {
      "2026-07-22": 10,
      "2026-07-23": 1,
    })
    const cells = calendar.weeks.flat().filter(Boolean)
    const busy = cells.find(
      (cell) => cell?.key === "2026-07-22",
    ) as ContributionGraphCell
    const quiet = cells.find(
      (cell) => cell?.key === "2026-07-23",
    ) as ContributionGraphCell
    const idle = cells.find(
      (cell) => cell?.key === "2026-07-24",
    ) as ContributionGraphCell
    expect(busy.value).toBe(10)
    expect(busy.level).toBe(4)
    expect(quiet.level).toBe(1)
    expect(idle.value).toBe(0)
    expect(idle.level).toBe(0)
  })

  it("reports the maximum value", () => {
    const calendar = calendarFor("2026-07-20", "2026-07-26", {
      "2026-07-22": 7,
      "2026-07-23": 3,
    })
    expect(calendar.maxValue).toBe(7)
  })

  it("handles an empty data set without dividing by zero", () => {
    const calendar = calendarFor("2026-07-20", "2026-07-26")
    expect(calendar.maxValue).toBe(0)
    expect(
      calendar.weeks
        .flat()
        .filter(Boolean)
        .every((c) => c?.level === 0),
    ).toBe(true)
  })

  it("labels months at the week their first in-range day falls in", () => {
    const calendar = calendarFor("2026-01-01", "2026-03-31")
    const labels = calendar.monthLabels.map((m) => m.label)
    expect(labels).toContain("Feb")
    const february = calendar.monthLabels.find(
      (m) => m.label === "Feb",
    ) as ContributionGraphMonthLabel
    expect(february.weekIndex).toBeGreaterThan(0)
    expect(february.span).toBeGreaterThan(1)
  })

  it("suppresses a month that spans a single week", () => {
    // A four-day range at the end of July never spans two week columns.
    const calendar = calendarFor("2026-07-27", "2026-07-30")
    expect(calendar.monthLabels).toEqual([])
  })

  it("honours explicit thresholds passed to buildCalendar", () => {
    const calendar = calendarFor(
      "2026-07-20",
      "2026-07-26",
      { "2026-07-22": 3, "2026-07-23": 9 },
      { thresholds: [1, 3, 6, 9] },
    )
    const cells = calendar.weeks.flat().filter(Boolean)
    const first = cells.find(
      (cell) => cell?.key === "2026-07-22",
    ) as ContributionGraphCell
    const second = cells.find(
      (cell) => cell?.key === "2026-07-23",
    ) as ContributionGraphCell
    expect(calendar.thresholds).toEqual([1, 3, 6, 9])
    expect(first.level).toBe(2)
    expect(second.level).toBe(4)
  })

  it("sets weekIndex and dayIndex to the cell's grid position", () => {
    const calendar = calendarFor("2026-07-20", "2026-08-02")
    for (const [weekIndex, week] of calendar.weeks.entries()) {
      for (const [dayIndex, cell] of week.entries()) {
        if (!cell) continue
        expect(cell.weekIndex).toBe(weekIndex)
        expect(cell.dayIndex).toBe(dayIndex)
      }
    }
  })
})
