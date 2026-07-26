"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import { Skeleton } from "@components/skeleton"
import { mountedCellRange } from "./mountRange"
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
    collapsed: boolean
  }) => React.ReactNode
  contentWidth: number
  header: React.ReactNode
  headerId: string
  onItemClick?: (item: T, bucket: TimelineBucket<T>) => void
  onRetry?: () => void
  selectable?: boolean
  selection: TimelineSelection
  /** The id holding the roving tab stop. */
  activeId: string | null
  /**
   * Renders this cell even when its row is outside `rowRange`, so the cell
   * holding DOM focus survives being scrolled out of the window.
   */
  pinnedIndex?: number
  onItemKeyDown: (event: React.KeyboardEvent<HTMLElement>, id: string) => void
  onFocusItem: (id: string) => void
  /** Reports that a cell received focus by any route (click, Tab, arrows). */
  onItemFocus: (id: string) => void
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
  activeId,
  pinnedIndex,
  onItemKeyDown,
  onFocusItem,
  onItemFocus,
}: VirtualizedTimelineBucketProps<T>) {
  const cells: React.ReactNode[] = []
  if (renderItem) {
    const renderCell = (itemIndex: number): React.ReactNode => {
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
        return (
          <div
            key={id}
            role="gridcell"
            // Counted from the bucket's full grid, not the mounted subset, or a
            // screen reader's reported position drifts as rows mount.
            aria-rowindex={row + 1}
            aria-colindex={column + 1}
            aria-selected={selectable ? selected : undefined}
            data-selected={selectable && selected ? "true" : undefined}
            data-item-id={id}
            tabIndex={id === activeId ? 0 : -1}
            className="dr-virtualized-timeline-tile"
            style={style}
            // Fires for focus landing anywhere inside the cell (focusin
            // bubbles), which is wanted: pinning must protect a focused
            // child of the tile just as much as the tile itself.
            onFocus={() => onItemFocus(id)}
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
                return
              }
              if (event.key === " " && selectable) {
                event.preventDefault()
                selection.toggle(id)
                return
              }
              if (event.key === "Home" || event.key === "End") {
                event.preventDefault()
                const ids = (items ?? []).map((entry, entryIndex) =>
                  getItemId(entry, entryIndex, bucket),
                )
                const target =
                  event.key === "Home" ? ids[0] : ids[ids.length - 1]
                if (target) onFocusItem(target)
                return
              }
              onItemKeyDown(event, id)
            }}
          >
            {renderItem({ item, index: itemIndex, bucket, selected })}
          </div>
        )
      }
      if (status !== "error" && status !== "loaded") {
        // A loader is free to resolve fewer items than `count` (server-side
        // filtering, a deletion between the count query and the fetch, an
        // off-by-one count). Once the bucket is `"loaded"` nothing will
        // retrigger a load, so a skeleton past the end of a short array
        // would spin forever; leave that slot empty instead.
        return (
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
          </div>
        )
      }
      return null
    }

    const range = rowRange
      ? mountedCellRange(bucket.count, columns, rowRange)
      : null
    if (range) {
      for (
        let itemIndex = range.first;
        itemIndex <= range.last;
        itemIndex += 1
      ) {
        cells.push(renderCell(itemIndex))
      }
    }
    if (
      pinnedIndex !== undefined &&
      (!range || pinnedIndex < range.first || pinnedIndex > range.last)
    ) {
      cells.push(renderCell(pinnedIndex))
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
          renderBucket({ bucket, items, status, contentWidth, collapsed })
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
