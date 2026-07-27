import { describe, expect, it } from "vitest"

import { computeBucketLayout } from "./useBucketLayout"
import { computeBucketWindow } from "./useBucketWindow"
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
  { id: "c", date: "2026-05-01", count: 0 },
]

// heights [252, 148, 48], offsets [0, 252, 400], total 448 (see useBucketLayout.test.ts)
const layout = computeBucketLayout({
  buckets,
  contentWidth: 412,
  collapsedIds: new Set<string>(),
  geometry,
})

function windowAt(scrollTop: number, overscanPx = 0) {
  return computeBucketWindow({
    buckets,
    layout,
    collapsedIds: new Set<string>(),
    scrollTop,
    viewportHeight: 300,
    overscanPx,
    geometry,
  })
}

describe("computeBucketWindow", () => {
  it("includes only the buckets intersecting the viewport", () => {
    const result = windowAt(0)
    expect(result.startIndex).toBe(0)
    expect(result.endIndex).toBe(1)
  })

  it("drops buckets scrolled past", () => {
    const result = windowAt(300)
    expect(result.startIndex).toBe(1)
    expect(result.endIndex).toBe(2)
  })

  it("widens the range by the overscan band", () => {
    expect(windowAt(300, 100).startIndex).toBe(0)
  })

  it("emits the visible row range of each mounted bucket", () => {
    // bucket a body starts at 32, rows stride 104: rows 0..1 both intersect
    // [0, 300]. bucket b body starts at 284, so only its single row does.
    const result = windowAt(0)
    expect(result.rows.get(0)).toEqual({ startRow: 0, endRow: 1 })
    expect(result.rows.get(1)).toEqual({ startRow: 0, endRow: 0 })
  })

  it("clamps the row range to the rows the bucket actually has", () => {
    const result = windowAt(300)
    expect(result.rows.get(1)).toEqual({ startRow: 0, endRow: 0 })
  })

  it("emits no row range for an empty bucket", () => {
    expect(windowAt(300).rows.has(2)).toBe(false)
  })

  it("emits no row range for a collapsed bucket", () => {
    const collapsedIds = new Set(["a"])
    const collapsedLayout = computeBucketLayout({
      buckets,
      contentWidth: 412,
      collapsedIds,
      geometry,
    })
    const result = computeBucketWindow({
      buckets,
      layout: collapsedLayout,
      collapsedIds,
      scrollTop: 0,
      viewportHeight: 300,
      overscanPx: 0,
      geometry,
    })
    expect(result.rows.has(0)).toBe(false)
    expect(result.startIndex).toBe(0)
  })

  it("reports an empty window for an empty bucket list", () => {
    const emptyLayout = computeBucketLayout({
      buckets: [],
      contentWidth: 412,
      collapsedIds: new Set<string>(),
      geometry,
    })
    const result = computeBucketWindow({
      buckets: [],
      layout: emptyLayout,
      collapsedIds: new Set<string>(),
      scrollTop: 0,
      viewportHeight: 300,
      overscanPx: 0,
      geometry,
    })
    expect(result.startIndex).toBe(0)
    expect(result.endIndex).toBe(-1)
    expect(result.rows.size).toBe(0)
  })

  it("survives a scrollTop past the end", () => {
    const result = windowAt(10_000)
    expect(result.startIndex).toBeLessThanOrEqual(result.endIndex + 1)
    expect(result.endIndex).toBeLessThan(buckets.length)
  })
})
