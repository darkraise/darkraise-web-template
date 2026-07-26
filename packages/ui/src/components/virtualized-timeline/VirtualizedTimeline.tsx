"use client"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import * as React from "react"

import { ChevronDown } from "lucide-react"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import { Checkbox } from "@components/checkbox"
import { useControllableState, useId } from "@primitives/state"
import { contentKey } from "./contentKey"
import { formatBucketLabel, toBucketDate } from "./labels"
import { useBucketItems } from "./useBucketItems"
import { useBucketLayout } from "./useBucketLayout"
import { useBucketWindow } from "./useBucketWindow"
import { useTimelineSelection } from "./useTimelineSelection"
import { VirtualizedTimelineBucket } from "./VirtualizedTimelineBucket"
import { VirtualizedTimelineScrubber } from "./VirtualizedTimelineScrubber"
import type {
  BucketGeometry,
  BucketStatus,
  TimelineBucket,
  TimelineGranularity,
} from "./types"
import "./virtualized-timeline.css"

declare const process: { env: { NODE_ENV?: string } }

type PendingFocusTarget =
  | { kind: "item"; id: string }
  | { kind: "header"; bucketId: string }

export interface VirtualizedTimelineProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  // `onError` is redeclared below with the bucket-loader signature, which
  // collides with the native DOM error handler this omit removes.
  "children" | "onError"
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
  loadBucket?: (bucket: TimelineBucket<T>) => Promise<T[]>
  maxLoadedBuckets?: number
  renderSkeleton?: (arg: {
    bucket: TimelineBucket<T>
    index: number
  }) => React.ReactNode
  /** Replaces the native DOM `onError` (omitted above); does not layer on it. */
  onError?: (error: unknown, bucket: TimelineBucket<T>) => void
  showScrubber?: boolean
  selectable?: boolean
  selectedIds?: Iterable<string>
  defaultSelectedIds?: Iterable<string>
  onSelectionChange?: (ids: string[]) => void
  collapsible?: boolean
  collapsedIds?: Iterable<string>
  defaultCollapsedIds?: Iterable<string>
  onCollapsedChange?: (ids: string[]) => void
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
  loadBucket,
  maxLoadedBuckets = 12,
  renderSkeleton,
  onError,
  showScrubber = true,
  selectable = false,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  collapsible = false,
  collapsedIds: collapsedIdsProp,
  defaultCollapsedIds,
  onCollapsedChange,
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

  // Same primitive-key memo as `useTimelineSelection`, for the same reason:
  // an inline spread hands `useControllableState` a new array identity every
  // render, and its mirroring effect then loops without end. See
  // `contentKey.ts` for why the key is built the way it is.
  const collapsedKey = collapsedIdsProp
    ? contentKey(collapsedIdsProp)
    : undefined
  const stableCollapsedIds = React.useMemo(
    () => (collapsedIdsProp ? Array.from(collapsedIdsProp) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on contents, not iterable identity
    [collapsedKey],
  )

  const [collapsedList, setCollapsedList] = useControllableState<string[]>({
    value: stableCollapsedIds,
    defaultValue: defaultCollapsedIds ? [...defaultCollapsedIds] : [],
    onChange: onCollapsedChange,
  })
  const collapsedIds = React.useMemo(
    () => new Set(collapsedList ?? []),
    [collapsedList],
  )

  const toggleCollapsed = React.useCallback(
    (id: string) => {
      setCollapsedList((prev) => {
        const next = new Set(prev ?? [])
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return [...next]
      })
    },
    [setCollapsedList],
  )

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

  const windowIndices = React.useMemo(() => {
    const indices: number[] = []
    for (
      let index = timelineWindow.startIndex;
      index <= timelineWindow.endIndex;
      index += 1
    ) {
      indices.push(index)
    }
    return indices
  }, [timelineWindow.startIndex, timelineWindow.endIndex])

  const bucketItems = useBucketItems<T>({
    buckets,
    windowIndices,
    loadBucket,
    maxLoadedBuckets,
    onError,
  })

  // Spans loaded buckets only: an unloaded bucket's item ids are not knowable
  // from a count, so it contributes nothing to the flat ordered list.
  const orderedIds = React.useMemo(() => {
    const ids: string[] = []
    for (const bucket of buckets) {
      const items = bucketItems.get(bucket.id).items
      if (!items) continue
      items.forEach((item, index) => ids.push(getItemId(item, index, bucket)))
    }
    return ids
  }, [buckets, bucketItems, getItemId])

  // Like `orderedIds`, but skipping collapsed buckets: a collapsed bucket's
  // cells never mount, so focus sent there could never land.
  const navigableIds = React.useMemo(() => {
    const ids: string[] = []
    for (const bucket of buckets) {
      if (collapsedIds.has(bucket.id)) continue
      const items = bucketItems.get(bucket.id).items
      if (!items) continue
      items.forEach((item, index) => ids.push(getItemId(item, index, bucket)))
    }
    return ids
  }, [buckets, bucketItems, collapsedIds, getItemId])

  const selection = useTimelineSelection({
    orderedIds,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
  })

  const bucketIdsFor = React.useCallback(
    (bucket: TimelineBucket<T>) => {
      const items = bucketItems.get(bucket.id).items
      if (!items) return []
      return items.map((item, index) => getItemId(item, index, bucket))
    },
    [bucketItems, getItemId],
  )

  const [pendingBucketIds, setPendingBucketIds] = React.useState<
    ReadonlySet<string>
  >(() => new Set())

  // A single shared value cannot track two buckets loading concurrently:
  // resolving bucket A's load would clear bucket B's pending marker too,
  // letting B's checkbox re-enable while its own load is still in flight.
  const markPending = React.useCallback((id: string, pending: boolean) => {
    setPendingBucketIds((prev) => {
      if (prev.has(id) === pending) return prev
      const next = new Set(prev)
      if (pending) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const selectBucket = React.useCallback(
    async (bucket: TimelineBucket<T>, next: boolean) => {
      let ids = bucketIdsFor(bucket)
      // An empty id list means "unloaded" only before a terminal status: a
      // loader that legitimately resolved zero items also leaves `ids`
      // empty, but is already `"loaded"` and must not be re-awaited on
      // every click.
      const status = bucketItems.get(bucket.id).status
      if (ids.length === 0 && status !== "loaded" && status !== "error") {
        markPending(bucket.id, true)
        try {
          const items = await bucketItems.ensure(bucket.id)
          if (!items) return
          ids = items.map((item, index) => getItemId(item, index, bucket))
        } finally {
          markPending(bucket.id, false)
        }
      }
      selection.setBucket(ids, next)
    },
    [bucketIdsFor, bucketItems, getItemId, markPending, selection],
  )

  const [activeItemId, setActiveItemId] = React.useState<string | null>(null)
  // Set when the target of a keyboard move is not mounted yet; the effect
  // below focuses it once it is.
  const pendingFocus = React.useRef<PendingFocusTarget | null>(null)

  const activeId =
    activeItemId && navigableIds.includes(activeItemId)
      ? activeItemId
      : (navigableIds[0] ?? null)

  // The active item can scroll out of the mounted set; without a mounted
  // fallback the whole timeline would drop out of the tab order until it
  // scrolled back in.
  const tabStopId = React.useMemo(() => {
    if (activeId === null) return null
    let fallback: string | null = null
    for (
      let index = timelineWindow.startIndex;
      index <= timelineWindow.endIndex;
      index += 1
    ) {
      const bucket = buckets[index]
      if (!bucket) continue
      const range = timelineWindow.rows.get(index)
      const items = bucketItems.get(bucket.id).items
      if (!range || !items) continue
      const first = range.startRow * layout.columns
      const last =
        Math.min(bucket.count, (range.endRow + 1) * layout.columns) - 1
      for (let itemIndex = first; itemIndex <= last; itemIndex += 1) {
        const item = items[itemIndex]
        if (item === undefined) continue
        const id = getItemId(item, itemIndex, bucket)
        if (id === activeId) return activeId
        fallback ??= id
      }
    }
    return fallback
  }, [
    activeId,
    bucketItems,
    buckets,
    getItemId,
    layout.columns,
    timelineWindow,
  ])

  const revealRange = React.useCallback((top: number, bottom: number) => {
    const element = scrollRef.current
    if (!element) return
    let next = element.scrollTop
    if (top < next) next = top
    else if (bottom > next + element.clientHeight)
      next = bottom - element.clientHeight
    if (next === element.scrollTop) return
    element.scrollTop = next
    // Read back rather than trusting `next`, for the same clamping reason as
    // the scrubber's onScrubTo.
    setScrollTop(element.scrollTop)
  }, [])

  const locateItem = React.useCallback(
    (id: string): { bucketIndex: number; itemIndex: number } | null => {
      for (
        let bucketIndex = 0;
        bucketIndex < buckets.length;
        bucketIndex += 1
      ) {
        const bucket = buckets[bucketIndex]!
        if (collapsedIds.has(bucket.id)) continue
        const items = bucketItems.get(bucket.id).items
        if (!items) continue
        for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
          if (getItemId(items[itemIndex]!, itemIndex, bucket) === id) {
            return { bucketIndex, itemIndex }
          }
        }
      }
      return null
    },
    [buckets, bucketItems, collapsedIds, getItemId],
  )

  const focusItem = React.useCallback(
    (id: string) => {
      setActiveItemId(id)
      const node = scrollRef.current?.querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(id)}"]`,
      )
      if (node) {
        pendingFocus.current = null
        node.focus()
        return
      }
      const location = locateItem(id)
      if (!location) {
        pendingFocus.current = null
        return
      }
      const row = Math.floor(location.itemIndex / layout.columns)
      const tileTop =
        layout.offsets[location.bucketIndex]! +
        headerHeight +
        row * (layout.tileHeight + gap)
      revealRange(tileTop, tileTop + layout.tileHeight)
      pendingFocus.current = { kind: "item", id }
    },
    [
      gap,
      headerHeight,
      layout.columns,
      layout.offsets,
      layout.tileHeight,
      locateItem,
      revealRange,
    ],
  )

  React.useLayoutEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    if (pending.kind === "item" && !navigableIds.includes(pending.id)) {
      pendingFocus.current = null
      return
    }
    if (
      pending.kind === "header" &&
      !buckets.some((bucket) => bucket.id === pending.bucketId)
    ) {
      pendingFocus.current = null
      return
    }
    const node =
      pending.kind === "item"
        ? scrollRef.current?.querySelector<HTMLElement>(
            `[data-item-id="${CSS.escape(pending.id)}"]`,
          )
        : document.getElementById(`${idBase}-header-${pending.bucketId}`)
    if (!node) return
    pendingFocus.current = null
    node.focus()
  })

  const moveFocus = React.useCallback(
    (fromId: string, delta: number) => {
      const index = navigableIds.indexOf(fromId)
      if (index < 0) return
      const target = navigableIds[index + delta]
      if (target) {
        focusItem(target)
        return
      }
      // Past the loaded range: the next bucket's ids are not knowable from its
      // count, so land on its header and load it rather than losing focus.
      const direction = delta > 0 ? 1 : -1
      const from = locateItem(fromId)
      if (!from) return
      let nextIndex = -1
      for (
        let bucketIndex = from.bucketIndex + direction;
        bucketIndex >= 0 && bucketIndex < buckets.length;
        bucketIndex += direction
      ) {
        const bucket = buckets[bucketIndex]!
        if (collapsedIds.has(bucket.id)) continue
        if (bucketItems.get(bucket.id).items === undefined) {
          nextIndex = bucketIndex
          break
        }
      }
      if (nextIndex < 0) return
      const nextBucket = buckets[nextIndex]!
      const headerDomId = `${idBase}-header-${nextBucket.id}`
      const header = document.getElementById(headerDomId)
      if (header) {
        pendingFocus.current = null
        header.focus()
      } else {
        const top = layout.offsets[nextIndex]!
        revealRange(top, top + headerHeight)
        pendingFocus.current = { kind: "header", bucketId: nextBucket.id }
      }
      void bucketItems.ensure(nextBucket.id).then((items) => {
        if (!items || items.length === 0) return
        // Only advance to the first item if focus is still parked where this
        // move left it; anything else means the user moved on mid-load, and
        // stealing focus back would be worse than staying put.
        const headerNode = document.getElementById(headerDomId)
        const pending = pendingFocus.current
        const stillOnHeader =
          (headerNode !== null && document.activeElement === headerNode) ||
          (pending?.kind === "header" && pending.bucketId === nextBucket.id)
        if (!stillOnHeader) return
        pendingFocus.current = {
          kind: "item",
          id: getItemId(items[0]!, 0, nextBucket),
        }
      })
    },
    [
      bucketItems,
      buckets,
      collapsedIds,
      focusItem,
      getItemId,
      headerHeight,
      idBase,
      layout.offsets,
      locateItem,
      navigableIds,
      revealRange,
    ],
  )

  const handleItemKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>, id: string) => {
      const rowsPerViewport = Math.max(
        1,
        Math.floor(viewportHeight / (layout.tileHeight + gap)),
      )
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault()
          moveFocus(id, 1)
          return
        case "ArrowLeft":
          event.preventDefault()
          moveFocus(id, -1)
          return
        case "ArrowDown":
          event.preventDefault()
          moveFocus(id, layout.columns)
          return
        case "ArrowUp":
          event.preventDefault()
          moveFocus(id, -layout.columns)
          return
        case "PageDown":
          event.preventDefault()
          moveFocus(id, layout.columns * rowsPerViewport)
          return
        case "PageUp":
          event.preventDefault()
          moveFocus(id, -layout.columns * rowsPerViewport)
          return
        default:
          return
      }
    },
    [gap, layout.columns, layout.tileHeight, moveFocus, viewportHeight],
  )

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
    const collapsed = collapsedIds.has(bucket.id)
    const bucketSelection = selectable
      ? selection.bucketState(bucketIdsFor(bucket))
      : "none"
    mounted.push(
      <VirtualizedTimelineBucket<T>
        key={bucket.id}
        bucket={bucket}
        index={index}
        top={layout.offsets[index]!}
        height={height}
        collapsed={collapsed}
        // The built-in path adds `bucketSpacing` below the body, so it comes
        // back off here. `getBucketHeight` returns the whole bucket height and
        // owns its own spacing, so only the header comes off there.
        bodyHeight={
          collapsed
            ? 0
            : Math.max(
                0,
                height - headerHeight - (getBucketHeight ? 0 : bucketSpacing),
              )
        }
        columns={layout.columns}
        tileHeight={layout.tileHeight}
        gap={gap}
        rowRange={timelineWindow.rows.get(index)}
        items={bucketItems.get(bucket.id).items}
        status={bucketItems.get(bucket.id).status}
        error={bucketItems.get(bucket.id).error}
        renderSkeleton={renderSkeleton}
        onRetry={() => bucketItems.retry(bucket.id)}
        getItemId={getItemId}
        renderItem={renderItem}
        renderBucket={renderBucket}
        contentWidth={contentWidth}
        headerId={headerId}
        onItemClick={onItemClick}
        selectable={selectable}
        selection={selection}
        activeId={tabStopId}
        onItemKeyDown={handleItemKeyDown}
        onFocusItem={focusItem}
        header={
          <div
            id={headerId}
            // Focusable programmatically (keyboard moves land here while a
            // bucket loads) without becoming a tab stop of its own.
            tabIndex={-1}
            className="dr-virtualized-timeline-bucket-header"
            style={{ height: headerHeight }}
          >
            {selectable ? (
              <Checkbox
                checked={
                  bucketSelection === "all"
                    ? true
                    : bucketSelection === "some"
                      ? "indeterminate"
                      : false
                }
                aria-label={`Select ${label}`}
                // An unloaded bucket has no ids to select, so the checkbox has
                // to await its load; disabling it during that wait is what
                // stops a second click from queueing a second load.
                disabled={pendingBucketIds.has(bucket.id)}
                data-pending={
                  pendingBucketIds.has(bucket.id) ? "true" : undefined
                }
                onCheckedChange={(next) => {
                  void selectBucket(bucket, next !== false)
                }}
              />
            ) : null}
            {collapsible ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
                onClick={() => toggleCollapsed(bucket.id)}
              >
                <ChevronDown
                  className="dr-virtualized-timeline-disclosure"
                  data-collapsed={collapsed ? "true" : undefined}
                />
              </Button>
            ) : null}
            {renderBucketHeader ? (
              renderBucketHeader({
                bucket,
                label,
                collapsed,
                selection: bucketSelection,
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
      {/* Must render unconditionally: the measurement effects above run once,
          right after the first commit, with an empty dependency array. If
          this element were absent on that first commit (e.g. because
          `buckets` started empty), `scrollRef` would stay null forever and
          the component would never measure itself even after buckets
          arrives on a later render. */}
      <div ref={scrollRef} className="dr-virtualized-timeline-viewport">
        {buckets.length === 0 ? (
          emptyState
        ) : (
          <div
            className="dr-virtualized-timeline-sizer"
            style={{ height: layout.totalSize }}
          >
            {mounted}
          </div>
        )}
      </div>
      {showScrubber ? (
        <VirtualizedTimelineScrubber<T>
          buckets={buckets}
          layout={layout}
          granularity={granularity}
          scrollTop={scrollTop}
          viewportHeight={viewportHeight}
          railHeight={viewportHeight}
          onScrubTo={(next) => {
            const element = scrollRef.current
            if (!element) return
            element.scrollTop = next
            // Read back rather than `setScrollTop(next)`: the browser
            // clamps the assignment above to the element's real scroll
            // range, but a raw `next` (e.g. a trailing bucket's offset
            // past maxScroll) would leave state holding the unclamped
            // value forever, since a pinned scrollTop that doesn't move
            // fires no native scroll event to correct it later.
            setScrollTop(element.scrollTop)
          }}
        />
      ) : null}
    </div>
  )
}
