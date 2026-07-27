export interface TimelineBucket<T = unknown> {
  /** Stable identity; also the loader cache key. */
  id: string
  /** Bucket start date. Drives the header label, the scrubber, and jump-to-date. */
  date: Date | string
  /** Number of items in this bucket. Known before the items are. */
  count: number
  /** Overrides the default formatted date in the header and scrubber label. */
  label?: string
  /** Inline items. When present, `loadBucket` is never called for this bucket. */
  items?: T[]
}

export type TimelineGranularity = "day" | "month" | "year"

/** Shape of a bucket's body. `renderBucket` overrides it entirely. */
export type TimelineLayout = "grid" | "list"

export type BucketStatus = "idle" | "loading" | "loaded" | "error"

/** Every value is in CSS pixels except `tileAspect`, a width / height ratio. */
export interface BucketGeometry {
  gap: number
  minTileWidth: number
  tileAspect: number
  headerHeight: number
  bucketSpacing: number
  layout: TimelineLayout
  /** Read in list layout only; grid derives its row height from the width. */
  rowHeight: number
}

export interface BucketLayout {
  columns: number
  tileWidth: number
  tileHeight: number
  /** Parallel to the bucket list. */
  heights: number[]
  /** Prefix sums of `heights`; `offsets[0]` is always 0. */
  offsets: number[]
  totalSize: number
}

export interface BucketRowRange {
  startRow: number
  /** Inclusive. */
  endRow: number
}

export interface BucketWindow {
  startIndex: number
  /** Inclusive. -1 when nothing is visible. */
  endIndex: number
  /** Keyed by bucket index. Absent for collapsed and empty buckets. */
  rows: Map<number, BucketRowRange>
}
