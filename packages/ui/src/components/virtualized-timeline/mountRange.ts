import type { BucketRowRange } from "./types"

export interface MountedCellRange {
  first: number
  /** Inclusive. */
  last: number
}

/**
 * The cell indices a bucket mounts for a row range. Shared by the bucket's
 * cell loop and the root's tab-stop fallback so the two can never disagree
 * about which cells are mounted.
 */
export function mountedCellRange(
  count: number,
  columns: number,
  rowRange: BucketRowRange,
): MountedCellRange {
  return {
    first: rowRange.startRow * columns,
    last: Math.min(count, (rowRange.endRow + 1) * columns) - 1,
  }
}
