"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import type { BucketRowRange, TimelineBucket, BucketStatus } from "./types"

export interface VirtualizedTimelineBucketProps<T> {
  bucket: TimelineBucket<T>
  index: number
  top: number
  height: number
  /** Already net of the header and, on the built-in path, the bucket spacing. */
  bodyHeight: number
  columns: number
  tileHeight: number
  gap: number
  rowRange: BucketRowRange | undefined
  items: T[] | undefined
  status: BucketStatus
  getItemId: (item: T, index: number, bucket: TimelineBucket<T>) => string
  renderItem?: (arg: {
    item: T
    index: number
    bucket: TimelineBucket<T>
    selected: boolean
  }) => React.ReactNode
  renderBucket?: (arg: {
    bucket: TimelineBucket<T>
    items: T[] | undefined
    status: BucketStatus
    contentWidth: number
  }) => React.ReactNode
  contentWidth: number
  header: React.ReactNode
  headerId: string
  onItemClick?: (item: T, bucket: TimelineBucket<T>) => void
}

export function VirtualizedTimelineBucket<T>({
  bucket,
  index,
  top,
  height,
  bodyHeight,
  columns,
  tileHeight,
  gap,
  rowRange,
  items,
  status,
  getItemId,
  renderItem,
  renderBucket,
  contentWidth,
  header,
  headerId,
  onItemClick,
}: VirtualizedTimelineBucketProps<T>) {
  const cells: React.ReactNode[] = []
  if (renderItem && rowRange && items) {
    const first = rowRange.startRow * columns
    const last = Math.min(bucket.count, (rowRange.endRow + 1) * columns) - 1
    for (let itemIndex = first; itemIndex <= last; itemIndex += 1) {
      const item = items[itemIndex]
      if (!item) continue
      const row = Math.floor(itemIndex / columns)
      const column = itemIndex % columns
      cells.push(
        <div
          key={getItemId(item, itemIndex, bucket)}
          role="gridcell"
          // Counted from the bucket's full grid, not the mounted subset, or a
          // screen reader's reported position drifts as rows mount.
          aria-rowindex={row + 1}
          aria-colindex={column + 1}
          className="dr-virtualized-timeline-tile"
          style={{
            top: row * (tileHeight + gap),
            left: `calc(${column} * (var(--vtimeline-tile-width) + ${gap}px))`,
          }}
          onClick={() => onItemClick?.(item, bucket)}
        >
          {renderItem({ item, index: itemIndex, bucket, selected: false })}
        </div>,
      )
    }
  }

  return (
    <div
      className="dr-virtualized-timeline-bucket"
      role="group"
      aria-labelledby={headerId}
      data-index={index}
      style={{ top, height }}
    >
      {header}
      <div
        className="dr-virtualized-timeline-bucket-body"
        style={{ height: bodyHeight }}
      >
        {renderBucket ? (
          renderBucket({ bucket, items, status, contentWidth })
        ) : (
          <div
            role="grid"
            aria-colcount={columns}
            aria-rowcount={Math.ceil(bucket.count / columns)}
            className={cn("dr-virtualized-timeline-grid")}
          >
            {cells}
          </div>
        )}
      </div>
    </div>
  )
}
