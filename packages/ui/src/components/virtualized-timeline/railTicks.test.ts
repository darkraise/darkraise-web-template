import { describe, expect, it } from "vitest"

import { buildRailTicks } from "./railTicks"
import type { TimelineBucket } from "./types"

// Descending by month, crossing a year boundary between index 1 and 2.
const buckets: TimelineBucket[] = [
  { id: "2026-07", date: "2026-07-01", count: 4 },
  { id: "2026-06", date: "2026-06-01", count: 4 },
  { id: "2025-12", date: "2025-12-01", count: 4 },
  { id: "2025-11", date: "2025-11-01", count: 4 },
]

// Evenly spaced: offsets 0/100/200/300 of a 400 total over a 400px rail
// means y === offset, which keeps every expectation below readable.
function ticks(overrides: Partial<Parameters<typeof buildRailTicks>[0]> = {}) {
  return buildRailTicks({
    buckets,
    offsets: [0, 100, 200, 300],
    totalSize: 400,
    railHeight: 400,
    showLabels: true,
    ...overrides,
  })
}

describe("buildRailTicks", () => {
  it("places a tick per bucket at its proportional offset", () => {
    expect(ticks().map((t) => t.y)).toEqual([0, 100, 200, 300])
  })

  it("scales positions to the rail height rather than the content height", () => {
    expect(ticks({ railHeight: 200 }).map((t) => t.y)).toEqual([
      0, 50, 100, 150,
    ])
  })

  it("marks the first bucket and every year change as a year tick", () => {
    expect(ticks().map((t) => t.kind)).toEqual(["year", "sub", "year", "sub"])
  })

  it("labels a year tick with its year and a sub tick with its short month", () => {
    expect(ticks().map((t) => t.label)).toEqual(["2026", "Jun", "2025", "Nov"])
  })

  it("omits every label when labels are off, keeping the ticks", () => {
    const result = ticks({ showLabels: false })
    expect(result).toHaveLength(4)
    expect(result.every((t) => t.label === undefined)).toBe(true)
  })

  it("thins sub ticks closer together than the minimum gap", () => {
    // A 40px rail puts the ticks at 0/10/20/30. Every gap is 10px. With
    // minTickGap 15, the sub tick at 10 is dropped (10 < 15 from year at 0)
    // and the sub at 30 is dropped (10 < 15 from year at 20). Only structural
    // year ticks survive.
    const result = ticks({ railHeight: 40, minTickGap: 15 })
    expect(result.map((t) => t.y)).toEqual([0, 20])
  })

  it("never thins a year tick, however tight the spacing", () => {
    // Both year ticks survive even at a gap far larger than their spacing.
    const result = ticks({ railHeight: 40, minTickGap: 100 })
    expect(result.filter((t) => t.kind === "year").map((t) => t.y)).toEqual([
      0, 20,
    ])
  })

  it("drops a sub label that would collide with a kept label", () => {
    // 400px rail, ticks at 0/100/200/300, but a 120px minimum label gap:
    // years at 0 and 200 are kept, the sub at 100 is 100 from the year at 0
    // so its label goes, and the sub at 300 is 100 from the year at 200 so
    // its label goes too. The ticks themselves stay.
    const result = ticks({ minLabelGap: 120 })
    expect(result.map((t) => t.label)).toEqual([
      "2026",
      undefined,
      "2025",
      undefined,
    ])
  })

  it("drops a year label that would collide with a previous year label", () => {
    const result = ticks({ railHeight: 40, minLabelGap: 100 })
    expect(result.find((t) => t.y === 0)?.label).toBe("2026")
    expect(result.find((t) => t.y === 20)?.label).toBeUndefined()
  })

  it("returns nothing for an empty bucket list", () => {
    expect(ticks({ buckets: [], offsets: [], totalSize: 0 })).toEqual([])
  })

  it("returns nothing before the rail has been measured", () => {
    expect(ticks({ railHeight: 0 })).toEqual([])
  })

  it("carries the bucket index and id so the caller can map back", () => {
    const first = ticks()[0]
    expect(first?.index).toBe(0)
    expect(first?.bucketId).toBe("2026-07")
  })

  it("preserves the invariant: no two sub ticks closer than minTickGap", () => {
    // Build 40 buckets all in the same year, spaced 10px apart. With
    // minTickGap=25, decimation should skip sub ticks to maintain spacing.
    const sameBuckets: TimelineBucket[] = Array.from(
      { length: 40 },
      (_, i) => ({
        id: `bucket-${i}`,
        date: "2026-01-01",
        count: 1,
      }),
    )
    const sameOffsets = Array.from({ length: 40 }, (_, i) => i * 10)

    const result = buildRailTicks({
      buckets: sameBuckets,
      offsets: sameOffsets,
      totalSize: 390,
      railHeight: 390,
      showLabels: false,
      minTickGap: 25,
    })

    // Filter to sub ticks only (first is year, rest are subs).
    const subs = result.filter((t) => t.kind === "sub")

    // Verify at least one sub tick survives.
    expect(subs.length).toBeGreaterThan(0)

    // Verify no two consecutive sub ticks violate the minimum gap.
    for (let i = 1; i < subs.length; i++) {
      const current = subs[i]
      const previous = subs[i - 1]
      if (current && previous) {
        const gap = current.y - previous.y
        expect(gap).toBeGreaterThanOrEqual(25)
      }
    }
  })
})
