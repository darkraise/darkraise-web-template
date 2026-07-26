"use client"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"

import type {
  BucketGeometry,
  BucketLayout,
  BucketRowRange,
  BucketWindow,
  TimelineBucket,
} from "./types"

export interface BucketWindowArgs<T> {
  buckets: TimelineBucket<T>[]
  layout: BucketLayout
  collapsedIds: ReadonlySet<string>
  scrollTop: number
  viewportHeight: number
  overscanPx: number
  geometry: BucketGeometry
}

/** Index of the last bucket whose offset is <= y, or 0. */
function findIndexAtOffset(offsets: number[], y: number): number {
  let low = 0
  let high = offsets.length - 1
  let found = 0
  while (low <= high) {
    const mid = (low + high) >> 1
    if (offsets[mid]! <= y) {
      found = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return found
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computeBucketWindow<T>({
  buckets,
  layout,
  collapsedIds,
  scrollTop,
  viewportHeight,
  overscanPx,
  geometry,
}: BucketWindowArgs<T>): BucketWindow {
  const rows = new Map<number, BucketRowRange>()
  if (buckets.length === 0) {
    return { startIndex: 0, endIndex: -1, rows }
  }

  const top = scrollTop - overscanPx
  const bottom = scrollTop + viewportHeight + overscanPx
  const { offsets, columns, tileHeight } = layout

  // Offsets are prefix sums of heights: offsets[i+1] === offsets[i] + heights[i].
  // The search returns the largest index whose offset is <= top, so the found
  // bucket always ends below top. A scrollTop past the end clamps naturally to
  // the last index.
  const startIndex = findIndexAtOffset(offsets, top)

  let endIndex = startIndex
  while (endIndex + 1 < buckets.length && offsets[endIndex + 1]! < bottom) {
    endIndex += 1
  }

  const rowStride = tileHeight + geometry.gap
  for (let index = startIndex; index <= endIndex; index += 1) {
    const bucket = buckets[index]!
    if (collapsedIds.has(bucket.id) || tileHeight <= 0) continue
    const rowCount = Math.ceil(bucket.count / columns)
    if (rowCount === 0) continue
    const bodyTop = offsets[index]! + geometry.headerHeight
    const startRow = clamp(
      Math.floor((top - bodyTop) / rowStride),
      0,
      rowCount - 1,
    )
    const endRow = clamp(
      Math.ceil((bottom - bodyTop) / rowStride) - 1,
      0,
      rowCount - 1,
    )
    rows.set(index, { startRow, endRow })
  }

  return { startIndex, endIndex, rows }
}

export function useBucketWindow<T>(args: BucketWindowArgs<T>): BucketWindow {
  const {
    buckets,
    layout,
    collapsedIds,
    scrollTop,
    viewportHeight,
    overscanPx,
    geometry,
  } = args
  return React.useMemo(
    () =>
      computeBucketWindow({
        buckets,
        layout,
        collapsedIds,
        scrollTop,
        viewportHeight,
        overscanPx,
        geometry,
      }),
    [
      buckets,
      layout,
      collapsedIds,
      scrollTop,
      viewportHeight,
      overscanPx,
      geometry,
    ],
  )
}
