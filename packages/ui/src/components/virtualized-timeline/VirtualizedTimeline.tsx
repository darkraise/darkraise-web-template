"use client"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"

import { cn } from "@lib/utils"
import { useId } from "@primitives/state"
import { formatBucketLabel, toBucketDate } from "./labels"
import { useBucketLayout } from "./useBucketLayout"
import { useBucketWindow } from "./useBucketWindow"
import { VirtualizedTimelineBucket } from "./VirtualizedTimelineBucket"
import type {
  BucketGeometry,
  BucketStatus,
  TimelineBucket,
  TimelineGranularity,
} from "./types"
import "./virtualized-timeline.css"

declare const process: { env: { NODE_ENV?: string } }

export interface VirtualizedTimelineProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  buckets: TimelineBucket<T>[]
  granularity?: TimelineGranularity
  renderItem?: (arg: {
    item: T
    index: number
    bucket: TimelineBucket<T>
    selected: boolean
  }) => React.ReactNode
  getItemId?: (item: T, index: number, bucket: TimelineBucket<T>) => string
  minTileWidth?: number
  tileAspect?: number
  gap?: number
  renderBucket?: (arg: {
    bucket: TimelineBucket<T>
    items: T[] | undefined
    status: BucketStatus
    contentWidth: number
  }) => React.ReactNode
  getBucketHeight?: (bucket: TimelineBucket<T>, contentWidth: number) => number
  renderBucketHeader?: (arg: {
    bucket: TimelineBucket<T>
    label: string
    collapsed: boolean
    selection: "none" | "some" | "all"
  }) => React.ReactNode
  headerHeight?: number
  bucketSpacing?: number
  overscanPx?: number
  onItemClick?: (item: T, bucket: TimelineBucket<T>) => void
  emptyState?: React.ReactNode
}

function defaultItemId<T>(
  item: T,
  index: number,
  bucket: TimelineBucket<T>,
): string {
  const candidate = (item as { id?: unknown }).id
  return typeof candidate === "string" ? candidate : `${bucket.id}:${index}`
}

export function VirtualizedTimeline<T>({
  className,
  buckets,
  granularity = "month",
  renderItem,
  getItemId = defaultItemId,
  minTileWidth = 140,
  tileAspect = 1,
  gap = 4,
  renderBucket,
  getBucketHeight,
  renderBucketHeader,
  headerHeight = 32,
  bucketSpacing = 16,
  overscanPx = 600,
  onItemClick,
  emptyState,
  ...props
}: VirtualizedTimelineProps<T>) {
  if (
    (renderBucket && !getBucketHeight) ||
    (getBucketHeight && !renderBucket)
  ) {
    throw new Error(
      "<VirtualizedTimeline> requires renderBucket and getBucketHeight together: a custom bucket body and its height are one decision.",
    )
  }

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const idBase = useId()
  const [contentWidth, setContentWidth] = React.useState(0)
  const [viewportHeight, setViewportHeight] = React.useState(0)
  const [scrollTop, setScrollTop] = React.useState(0)

  const geometry = React.useMemo<BucketGeometry>(
    () => ({ gap, minTileWidth, tileAspect, headerHeight, bucketSpacing }),
    [gap, minTileWidth, tileAspect, headerHeight, bucketSpacing],
  )

  // Collapse lands in a later task; an empty set keeps the layout signature
  // stable until then.
  const collapsedIds = React.useMemo(() => new Set<string>(), [])

  const layout = useBucketLayout({
    buckets,
    contentWidth,
    collapsedIds,
    geometry,
    getBucketHeight,
  })

  const timelineWindow = useBucketWindow({
    buckets,
    layout,
    collapsedIds,
    scrollTop,
    viewportHeight,
    overscanPx,
    geometry,
  })

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const measure = () => {
      setContentWidth(element.clientWidth)
      setViewportHeight(element.clientHeight)
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // One state update per frame, not per scroll event.
  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setScrollTop(element.scrollTop)
      })
    }
    element.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      element.removeEventListener("scroll", onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (buckets.length < 2) return
    const times = buckets.map((bucket) => toBucketDate(bucket.date).getTime())
    const ascending = times.every((t, i) => i === 0 || t >= times[i - 1]!)
    const descending = times.every((t, i) => i === 0 || t <= times[i - 1]!)
    if (!ascending && !descending) {
      console.warn(
        "<VirtualizedTimeline> expects buckets sorted by date, ascending or descending. Unsorted buckets make the scrubber and jump-to-date land on the wrong bucket.",
      )
    }
  }, [buckets])

  if (buckets.length === 0) {
    return (
      <div className={cn("dr-virtualized-timeline", className)} {...props}>
        {emptyState}
      </div>
    )
  }

  const mounted: React.ReactNode[] = []
  for (
    let index = timelineWindow.startIndex;
    index <= timelineWindow.endIndex;
    index += 1
  ) {
    const bucket = buckets[index]
    if (!bucket) continue
    const label = formatBucketLabel(bucket, granularity)
    const headerId = `${idBase}-header-${bucket.id}`
    const height = layout.heights[index]!
    mounted.push(
      <VirtualizedTimelineBucket<T>
        key={bucket.id}
        bucket={bucket}
        index={index}
        top={layout.offsets[index]!}
        height={height}
        // The built-in path adds `bucketSpacing` below the body, so it comes
        // back off here. `getBucketHeight` returns the whole bucket height and
        // owns its own spacing, so only the header comes off there.
        bodyHeight={Math.max(
          0,
          height - headerHeight - (getBucketHeight ? 0 : bucketSpacing),
        )}
        columns={layout.columns}
        tileHeight={layout.tileHeight}
        gap={gap}
        rowRange={timelineWindow.rows.get(index)}
        items={bucket.items}
        status={bucket.items ? "loaded" : "idle"}
        getItemId={getItemId}
        renderItem={renderItem}
        renderBucket={renderBucket}
        contentWidth={contentWidth}
        headerId={headerId}
        onItemClick={onItemClick}
        header={
          <div
            id={headerId}
            className="dr-virtualized-timeline-bucket-header"
            style={{ height: headerHeight }}
          >
            {renderBucketHeader ? (
              renderBucketHeader({
                bucket,
                label,
                collapsed: false,
                selection: "none",
              })
            ) : (
              <span>{label}</span>
            )}
          </div>
        }
      />,
    )
  }

  return (
    <div
      className={cn("dr-virtualized-timeline", className)}
      style={
        {
          "--vtimeline-gap": `${gap}px`,
          "--vtimeline-header-height": `${headerHeight}px`,
          "--vtimeline-tile-width": `${layout.tileWidth}px`,
          "--vtimeline-tile-height": `${layout.tileHeight}px`,
          "--vtimeline-columns": layout.columns,
        } as React.CSSProperties
      }
      {...props}
    >
      <div ref={scrollRef} className="dr-virtualized-timeline-viewport">
        <div
          className="dr-virtualized-timeline-sizer"
          style={{ height: layout.totalSize }}
        >
          {mounted}
        </div>
      </div>
    </div>
  )
}
