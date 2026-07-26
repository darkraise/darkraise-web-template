import { describe, expect, it } from "vitest"

import { computeBucketLayout } from "./useBucketLayout"
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

// contentWidth 412 divides exactly: floor((412 + 4) / (100 + 4)) = 4 columns,
// (412 - 3 * 4) / 4 = 100px tiles, so every expected value below is an integer.
const WIDTH = 412

function layout(
  overrides: Partial<Parameters<typeof computeBucketLayout>[0]> = {},
) {
  return computeBucketLayout({
    buckets,
    contentWidth: WIDTH,
    collapsedIds: new Set<string>(),
    geometry,
    ...overrides,
  })
}

describe("computeBucketLayout", () => {
  it("derives the column count and tile size from the content width", () => {
    const result = layout()
    expect(result.columns).toBe(4)
    expect(result.tileWidth).toBe(100)
    expect(result.tileHeight).toBe(100)
  })

  it("honours the tile aspect ratio", () => {
    const result = layout({ geometry: { ...geometry, tileAspect: 2 } })
    expect(result.tileWidth).toBe(100)
    expect(result.tileHeight).toBe(50)
  })

  it("never drops below one column, however narrow the container", () => {
    expect(layout({ contentWidth: 20 }).columns).toBe(1)
  })

  it("computes each bucket height from its count", () => {
    // a: 2 rows -> 32 + (2*100 + 1*4) + 16 = 252
    // b: 1 row  -> 32 + 100 + 16          = 148
    // c: 0 rows -> 32 + 0 + 16            = 48
    expect(layout().heights).toEqual([252, 148, 48])
  })

  it("emits prefix-sum offsets and a total", () => {
    const result = layout()
    expect(result.offsets).toEqual([0, 252, 400])
    expect(result.totalSize).toBe(448)
  })

  it("collapses a bucket to header height alone", () => {
    const result = layout({ collapsedIds: new Set(["a"]) })
    expect(result.heights).toEqual([32, 148, 48])
    expect(result.offsets).toEqual([0, 32, 180])
    expect(result.totalSize).toBe(228)
  })

  it("reserves no body height before the container has been measured", () => {
    const result = layout({ contentWidth: 0 })
    expect(result.tileHeight).toBe(0)
    expect(result.heights).toEqual([48, 48, 48])
  })

  it("uses getBucketHeight when the consumer owns the bucket body", () => {
    const result = layout({
      getBucketHeight: (bucket, width) => {
        expect(width).toBe(WIDTH)
        return 10 + bucket.count
      },
    })
    expect(result.heights).toEqual([18, 13, 10])
    expect(result.offsets).toEqual([0, 18, 31])
    expect(result.totalSize).toBe(41)
  })

  it("handles an empty bucket list", () => {
    const result = layout({ buckets: [] })
    expect(result.heights).toEqual([])
    expect(result.offsets).toEqual([])
    expect(result.totalSize).toBe(0)
  })
})
