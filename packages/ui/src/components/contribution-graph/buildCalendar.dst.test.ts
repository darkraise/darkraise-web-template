import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type * as BuildCalendarModule from "./buildCalendar"
import type { ContributionGraphCell } from "./buildCalendar"

/**
 * America/Santiago (like Asunción, Havana, Beirut, and the Azores) springs
 * forward AT MIDNIGHT: local 00:00 does not exist on the transition day, and
 * ECMAScript resolves the nonexistent time with the pre-transition offset, so
 * a `Date` walked forward with `setDate` lands on 01:00 and stays there for
 * the rest of the walk. Any `cursor <= end` timestamp comparison then reports
 * the end date as out of range and drops it from the grid.
 *
 * The whole file runs under that timezone, set before the module is imported
 * so nothing captures the ambient zone at load time.
 */
const ORIGINAL_TZ = process.env.TZ

let buildCalendar: typeof BuildCalendarModule.buildCalendar
let parseISODate: typeof BuildCalendarModule.parseISODate

beforeAll(async () => {
  process.env.TZ = "America/Santiago"
  const module = await import("./buildCalendar")
  buildCalendar = module.buildCalendar
  parseISODate = module.parseISODate
})

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ
})

function realCells(
  start: string,
  end: string,
  weekStartsOn = 0,
): ContributionGraphCell[] {
  const calendar = buildCalendar({
    startDate: parseISODate(start),
    endDate: parseISODate(end),
    weekStartsOn,
    values: new Map(),
    levels: 4,
  })
  return calendar.weeks
    .flat()
    .filter((cell): cell is ContributionGraphCell => Boolean(cell))
}

describe("buildCalendar across a midnight DST transition", () => {
  it("runs in a timezone that really does spring forward at midnight", () => {
    // Without this guard the two assertions below would pass vacuously on a
    // runner whose ICU data lacks the rule, which is exactly how an earlier
    // timezone guard in this component managed to look right and never fail.
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
      "America/Santiago",
    )
    expect(new Date(2026, 8, 6).getHours()).toBe(1)
  })

  it("emits the end date as a real cell, not padding", () => {
    const cells = realCells("2026-01-01", "2026-12-31")
    expect(cells.map((cell) => cell.key)).toContain("2026-12-31")
    expect(cells).toHaveLength(365)
  })

  it("keeps the final week column when the end date is its only occupant", () => {
    // 2026-12-27 is a Sunday, so on a Sunday-start grid it sits alone in the
    // last column — dropping it removes the entire column, not just one cell.
    const calendar = buildCalendar({
      startDate: parseISODate("2026-01-01"),
      endDate: parseISODate("2026-12-27"),
      weekStartsOn: 0,
      values: new Map(),
      levels: 4,
    })
    const lastWeek = calendar.weeks[calendar.weeks.length - 1]
    expect(lastWeek?.[0]?.key).toBe("2026-12-27")
  })
})
