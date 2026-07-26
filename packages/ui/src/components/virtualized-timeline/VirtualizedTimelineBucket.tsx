"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import { Skeleton } from "@components/skeleton"
import type { TimelineSelection } from "./useTimelineSelection"
import type { BucketRowRange, TimelineBucket, BucketStatus } from "./types"

export interface VirtualizedTimelineBucketProps<T> {
  bucket: TimelineBucket<T>
  index: number
  top: number
  height: number
  collapsed: boolean
  /** Already net of the header and, on the built-in path, the bucket spacing. */
  bodyHeight: number
  columns: number
  tileHeight: number
  gap: number
  rowRange: BucketRowRange | undefined
  items: T[] | undefined
  status: BucketStatus
  error?: unknown
  getItemId: (item: T, index: number, bucket: TimelineBucket<T>) => string
  renderItem?: (arg: {
    item: T
    index: number
    bucket: TimelineBucket<T>
    selected: boolean
  }) => React.ReactNode
  renderSkeleton?: (arg: {
    bucket: TimelineBucket<T>
    index: number
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
  onRetry?: () => void
  selectable?: boolean
  selection: TimelineSelection
}

export function VirtualizedTimelineBucket<T>({
  bucket,
  index,
  top,
  height,
  collapsed,
  bodyHeight,
  columns,
  tileHeight,
  gap,
  rowRange,
  items,
  status,
  error,
  getItemId,
  renderItem,
  renderSkeleton,
  renderBucket,
  contentWidth,
  header,
  headerId,
  onItemClick,
  onRetry,
  selectable,
  selection,
}: VirtualizedTimelineBucketProps<T>) {
  const cells: React.ReactNode[] = []
  if (renderItem && rowRange) {
    const first = rowRange.startRow * columns
    const last = Math.min(bucket.count, (rowRange.endRow + 1) * columns) - 1
    for (let itemIndex = first; itemIndex <= last; itemIndex += 1) {
      const row = Math.floor(itemIndex / columns)
      const column = itemIndex % columns
      // Computed once per index and shared by both branches below, so a real
      // tile and the skeleton that preceded it can never land in different
      // positions.
      const style = {
        top: row * (tileHeight + gap),
        left: `calc(${column} * (var(--vtimeline-tile-width) + ${gap}px))`,
      }
      const item = items?.[itemIndex]
      if (item) {
        const id = getItemId(item, itemIndex, bucket)
        const selected = selectable ? selection.isSelected(id) : false
        cells.push(
          <div
            key={id}
            role="gridcell"
            // Counted from the bucket's full grid, not the mounted subset, or a
            // screen reader's reported position drifts as rows mount.
            aria-rowindex={row + 1}
            aria-colindex={column + 1}
            aria-selected={selectable ? selected : undefined}
            data-selected={selectable && selected ? "true" : undefined}
            className="dr-virtualized-timeline-tile"
            style={style}
            onClick={(event) => {
              if (!selectable) {
                onItemClick?.(item, bucket)
                return
              }
              if (event.shiftKey) selection.extendTo(id)
              else selection.toggle(id)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onItemClick?.(item, bucket)
              } else if (event.key === " " && selectable) {
                event.preventDefault()
                selection.toggle(id)
              }
            }}
          >
            {renderItem({ item, index: itemIndex, bucket, selected })}
          </div>,
        )
      } else if (status !== "error" && status !== "loaded") {
        // A loader is free to resolve fewer items than `count` (server-side
        // filtering, a deletion between the count query and the fetch, an
        // off-by-one count). Once the bucket is `"loaded"` nothing will
        // retrigger a load, so a skeleton past the end of a short array
        // would spin forever; leave that slot empty instead.
        cells.push(
          <div
            key={`skeleton-${itemIndex}`}
            aria-hidden="true"
            className="dr-virtualized-timeline-tile"
            style={style}
          >
            {renderSkeleton ? (
              renderSkeleton({ bucket, index: itemIndex })
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>,
        )
      }
    }
  }

  return (
    <div
      className="dr-virtualized-timeline-bucket"
      role="group"
      aria-labelledby={headerId}
      data-index={index}
      data-collapsed={collapsed ? "true" : undefined}
      style={{ top, height }}
    >
      {header}
      <div
        className="dr-virtualized-timeline-bucket-body"
        style={{ height: bodyHeight }}
      >
        {renderBucket ? (
          renderBucket({ bucket, items, status, contentWidth })
        ) : status === "error" ? (
          <div className="dr-virtualized-timeline-error" role="alert">
            <span>
              {error instanceof Error ? error.message : String(error)}
            </span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : (
          <div
            role="grid"
            aria-colcount={columns}
            aria-rowcount={Math.ceil(bucket.count / columns)}
            aria-multiselectable={selectable ? true : undefined}
            className={cn("dr-virtualized-timeline-grid")}
          >
            {cells}
          </div>
        )}
      </div>
    </div>
  )
}
