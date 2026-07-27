"use client"

import * as React from "react"

import type { BucketGeometry, BucketLayout, TimelineBucket } from "./types"

export interface BucketLayoutArgs<T> {
  buckets: TimelineBucket<T>[]
  contentWidth: number
  collapsedIds: ReadonlySet<string>
  geometry: BucketGeometry
  getBucketHeight?: (bucket: TimelineBucket<T>, contentWidth: number) => number
}

export function computeBucketLayout<T>({
  buckets,
  contentWidth,
  collapsedIds,
  geometry,
  getBucketHeight,
}: BucketLayoutArgs<T>): BucketLayout {
  const { gap, minTileWidth, tileAspect, headerHeight, bucketSpacing } =
    geometry

  const columns =
    contentWidth > 0
      ? Math.max(1, Math.floor((contentWidth + gap) / (minTileWidth + gap)))
      : 1
  const tileWidth =
    contentWidth > 0 ? (contentWidth - (columns - 1) * gap) / columns : 0
  const tileHeight = tileWidth / tileAspect

  const heights: number[] = []
  const offsets: number[] = []
  let cursor = 0

  for (const bucket of buckets) {
    offsets.push(cursor)
    let height: number
    // Collapse is the more specific state, so it wins over a custom
    // `getBucketHeight`: a collapsed bucket is its header, whoever owns the
    // body's height when expanded.
    if (collapsedIds.has(bucket.id)) {
      height = headerHeight
    } else if (getBucketHeight) {
      height = getBucketHeight(bucket, contentWidth)
    } else {
      // Zero rows before the first measurement: with tileHeight 0 a row count
      // derived from the count would reserve gap-only body height for nothing.
      const rows = tileHeight > 0 ? Math.ceil(bucket.count / columns) : 0
      const bodyHeight = rows * tileHeight + Math.max(0, rows - 1) * gap
      height = headerHeight + bodyHeight + bucketSpacing
    }
    heights.push(height)
    cursor += height
  }

  return { columns, tileWidth, tileHeight, heights, offsets, totalSize: cursor }
}

export function useBucketLayout<T>(args: BucketLayoutArgs<T>): BucketLayout {
  const { buckets, contentWidth, collapsedIds, geometry, getBucketHeight } =
    args
  return React.useMemo(
    () =>
      computeBucketLayout({
        buckets,
        contentWidth,
        collapsedIds,
        geometry,
        getBucketHeight,
      }),
    [buckets, contentWidth, collapsedIds, geometry, getBucketHeight],
  )
}
