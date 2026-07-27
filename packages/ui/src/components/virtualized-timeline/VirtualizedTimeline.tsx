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
import { mountedCellRange } from "./mountRange"
import { useBucketItems } from "./useBucketItems"
import { useBucketLayout } from "./useBucketLayout"
import { useBucketWindow } from "./useBucketWindow"
import { useTimelineSelection } from "./useTimelineSelection"
import { VirtualizedTimelineBucket } from "./VirtualizedTimelineBucket"
import { VirtualizedTimelineJumpToDate } from "./VirtualizedTimelineJumpToDate"
import { VirtualizedTimelineScrubber } from "./VirtualizedTimelineScrubber"
import type {
  BucketGeometry,
  BucketStatus,
  TimelineBucket,
  TimelineGranularity,
  TimelineLayout,
} from "./types"
import "./virtualized-timeline.css"

declare const process: { env: { NODE_ENV?: string } }

/** Must match the container query in virtualized-timeline.css. Paired so the
 *  JavaScript label decision and the CSS width decision cannot disagree. */
const RAIL_LABEL_BREAKPOINT = 480

/** Index of the last bucket whose offset is <= y, or 0. Mirrors the private
 *  helper in `useBucketWindow.ts`, which isn't exported. */
function findBucketAtOffset(offsets: number[], y: number): number {
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

type PendingFocusTarget =
  | { kind: "item"; id: string }
  | { kind: "header"; bucketId: string }

export interface VirtualizedTimelineHandle {
  scrollToDate: (
    date: Date | string,
    opts?: { align?: "start" | "center" },
  ) => void
  scrollToBucket: (id: string, opts?: { align?: "start" | "center" }) => void
  /** Ids of the buckets genuinely intersecting the viewport — not the
   *  overscanned mount window, which extends past what the reader can see. */
  getVisibleBucketIds: () => string[]
}

export interface VirtualizedTimelineProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  // `onError` is redeclared below with the bucket-loader signature, which
  // collides with the native DOM error handler this omit removes.
  "children" | "onError"
> {
  ref?: React.Ref<VirtualizedTimelineHandle>
  buckets: TimelineBucket<T>[]
  granularity?: TimelineGranularity
  renderItem?: (arg: {
    item: T
    index: number
    bucket: TimelineBucket<T>
    selected: boolean
  }) => React.ReactNode
  /** Ids must be unique across the whole timeline, not just within a bucket:
   *  selection, focus, and keyboard navigation all key on them globally. */
  getItemId?: (item: T, index: number, bucket: TimelineBucket<T>) => string
  minTileWidth?: number
  tileAspect?: number
  gap?: number
  /** Bucket body shape. Ignored when `renderBucket` is supplied. */
  layout?: TimelineLayout
  /** Row height in CSS pixels. List layout only. */
  rowHeight?: number
  renderBucket?: (arg: {
    bucket: TimelineBucket<T>
    items: T[] | undefined
    status: BucketStatus
    contentWidth: number
    /** The body's box is header-only while collapsed; render accordingly. */
    collapsed: boolean
  }) => React.ReactNode
  /**
   * Must return the bucket's whole height: header (`headerHeight`) plus body
   * plus the bucket's own inter-bucket spacing. A collapsed bucket is sized
   * to `headerHeight` by the component and never reaches this callback.
   * Memoize it — the layout recomputes whenever its identity changes.
   */
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
  /** Fires on click only while `selectable` is off — a click selects when it
   *  is on. Enter activates the focused item in either mode. */
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
  /** Which edge the scrubber rail occupies. Physical rather than logical:
   *  the package has no RTL or `dir` handling anywhere, and `Tooltip`,
   *  `Sheet`, `Select`, and `Menubar` all take a physical `side` too. */
  scrubberSide?: "left" | "right"
  selectable?: boolean
  selectedIds?: Iterable<string>
  defaultSelectedIds?: Iterable<string>
  onSelectionChange?: (ids: string[]) => void
  collapsible?: boolean
  collapsedIds?: Iterable<string>
  defaultCollapsedIds?: Iterable<string>
  onCollapsedChange?: (ids: string[]) => void
  showJumpToDate?: boolean
}

function defaultItemId<T>(
  item: T,
  index: number,
  bucket: TimelineBucket<T>,
): string {
  const candidate = (item as { id?: unknown }).id
  return typeof candidate === "string" ? candidate : `${bucket.id}:${index}`
}

/**
 * The component delegates its height to the consumer: give it a bounded
 * height (a `h-*` class, or a flex parent with `min-h-0`). Unbounded, the
 * scroll container grows to its content, every bucket mounts at once, and a
 * large collection can hang the tab.
 */
export function VirtualizedTimeline<T>({
  className,
  style,
  buckets,
  granularity = "month",
  renderItem,
  getItemId = defaultItemId,
  minTileWidth: minTileWidthProp,
  tileAspect: tileAspectProp,
  gap: gapProp,
  layout: layoutProp = "grid",
  rowHeight = 44,
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
  scrubberSide = "right",
  selectable = false,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  collapsible = false,
  collapsedIds: collapsedIdsProp,
  defaultCollapsedIds,
  onCollapsedChange,
  showJumpToDate = false,
  ref,
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

  const list = layoutProp === "list"
  const minTileWidth = minTileWidthProp ?? 140
  const tileAspect = tileAspectProp ?? 1
  // Adjacent full-bleed rows want a divider, not a gutter, so a list defaults
  // to no gap; an explicit `gap` still wins in either layout.
  const gap = gapProp ?? (list ? 0 : 4)

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null)
  const idBase = useId()
  const [contentWidth, setContentWidth] = React.useState(0)
  const [viewportHeight, setViewportHeight] = React.useState(0)
  const [scrollAreaWidth, setScrollAreaWidth] = React.useState(0)
  const [scrollTop, setScrollTop] = React.useState(0)

  // The cell holding the roving tab stop, with its owning bucket carried
  // alongside: the bucket index must reach `windowIndices` (eviction
  // protection) before `useBucketItems` runs, and deriving it from
  // `bucketItems` there would be a dependency cycle.
  const [activeItem, setActiveItem] = React.useState<{
    id: string
    bucketId: string
  } | null>(null)

  const setActive = React.useCallback((id: string, bucketId: string) => {
    // Idempotent by content: focus events re-report the already-active cell
    // (e.g. after the pending-focus effect), and a fresh object there would
    // re-render for nothing.
    setActiveItem((prev) =>
      prev && prev.id === id && prev.bucketId === bucketId
        ? prev
        : { id, bucketId },
    )
  }, [])

  const geometry = React.useMemo<BucketGeometry>(
    () => ({
      gap,
      minTileWidth,
      tileAspect,
      headerHeight,
      bucketSpacing,
      layout: layoutProp,
      rowHeight,
    }),
    [
      gap,
      minTileWidth,
      tileAspect,
      headerHeight,
      bucketSpacing,
      layoutProp,
      rowHeight,
    ],
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

  const activeBucketIndex = activeItem
    ? buckets.findIndex((bucket) => bucket.id === activeItem.bucketId)
    : -1
  // -1 whenever the active bucket sits inside the window, so arrowing around
  // in view never changes the memo's inputs (a fresh `windowIndices` identity
  // would churn the loader effect every render).
  const pinnedLoadIndex =
    activeBucketIndex >= 0 &&
    (activeBucketIndex < timelineWindow.startIndex ||
      activeBucketIndex > timelineWindow.endIndex)
      ? activeBucketIndex
      : -1

  const windowIndices = React.useMemo(() => {
    const indices: number[] = []
    for (
      let index = timelineWindow.startIndex;
      index <= timelineWindow.endIndex;
      index += 1
    ) {
      indices.push(index)
    }
    // The active bucket stays wanted while focus is parked there: eviction
    // shields whatever `windowIndices` names, and evicting it would strip the
    // pinned cell's item and drop focus. The render window is unaffected —
    // it is driven by the row ranges, not this array.
    if (pinnedLoadIndex >= 0) indices.push(pinnedLoadIndex)
    return indices
  }, [timelineWindow.startIndex, timelineWindow.endIndex, pinnedLoadIndex])

  const bucketItems = useBucketItems<T>({
    buckets,
    windowIndices,
    loadBucket,
    maxLoadedBuckets,
    onError,
  })

  // Spans loaded buckets only: an unloaded bucket's item ids are not knowable
  // from a count, so it contributes nothing to the flat ordered list.
  const buildIdList = React.useCallback(
    (skipBucket: (bucket: TimelineBucket<T>) => boolean) => {
      const ids: string[] = []
      for (const bucket of buckets) {
        if (skipBucket(bucket)) continue
        const items = bucketItems.get(bucket.id).items
        if (!items) continue
        items.forEach((item, index) => ids.push(getItemId(item, index, bucket)))
      }
      return ids
    },
    [buckets, bucketItems, getItemId],
  )

  const orderedIds = React.useMemo(
    () => buildIdList(() => false),
    [buildIdList],
  )

  // Like `orderedIds`, but skipping collapsed buckets: a collapsed bucket's
  // cells never mount, so focus sent there could never land.
  const navigableIds = React.useMemo(
    () => buildIdList((bucket) => collapsedIds.has(bucket.id)),
    [buildIdList, collapsedIds],
  )

  const selection = useTimelineSelection({
    orderedIds,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
  })

  // `selectBucket` writes the selection after awaiting a load, and the
  // `selection` it closed over resolves updates against the render that
  // created it — writing through that after the await would erase every
  // selection change committed during the wait. The ref always holds the
  // latest committed selection instead. It is not a complete fix: two
  // bucket-select awaits resolving in the same microtask flush still
  // clobber each other, because both read this same committed selection
  // and `useControllableState` resolves updaters against that captured
  // value. Closing that belongs to the primitive's own ref-backed rewrite,
  // tracked separately.
  const selectionRef = React.useRef(selection)
  React.useLayoutEffect(() => {
    selectionRef.current = selection
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
      selectionRef.current.setBucket(ids, next)
    },
    [bucketIdsFor, bucketItems, getItemId, markPending],
  )

  // Set when the target of a keyboard move is not mounted yet; the effect
  // below focuses it once it is.
  const pendingFocus = React.useRef<PendingFocusTarget | null>(null)

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

  const activeId =
    activeItem && navigableIds.includes(activeItem.id) ? activeItem.id : null

  // Keeps the active cell renderable even when scrolled out of the window:
  // unmounting the element holding DOM focus drops focus to <body>, and the
  // next Tab would restart from the top of the page.
  const pinned = activeId ? locateItem(activeId) : null

  const tabStopId = React.useMemo(() => {
    // The active cell is always rendered — pinned into the mount set when it
    // falls outside the window — so it can always hold the tab stop.
    if (activeId) return activeId
    // Before any keyboard interaction, the first mounted cell takes the tab
    // stop so tabbing in lands on something visible.
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
      const { first, last } = mountedCellRange(
        bucket.count,
        layout.columns,
        range,
      )
      for (let itemIndex = first; itemIndex <= last; itemIndex += 1) {
        const item = items[itemIndex]
        if (item === undefined) continue
        return getItemId(item, itemIndex, bucket)
      }
    }
    return null
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

  const focusItem = React.useCallback(
    (id: string) => {
      const location = locateItem(id)
      if (!location) {
        pendingFocus.current = null
        return
      }
      setActive(id, buckets[location.bucketIndex]!.id)
      const node = scrollRef.current?.querySelector<HTMLElement>(
        `[data-item-id="${CSS.escape(id)}"]`,
      )
      if (node) {
        pendingFocus.current = null
        node.focus()
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
      buckets,
      gap,
      headerHeight,
      layout.columns,
      layout.offsets,
      layout.tileHeight,
      locateItem,
      revealRange,
      setActive,
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
        const firstId = getItemId(items[0]!, 0, nextBucket)
        pendingFocus.current = { kind: "item", id: firstId }
        // The roving tab stop must follow: without this the pend focuses the
        // cell while the tab stop stays on the previous bucket's last cell.
        setActive(firstId, nextBucket.id)
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
      setActive,
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
          // A listbox reserves nothing for the horizontal axis, and with one
          // column a horizontal step would just duplicate ArrowDown. Returning
          // without preventDefault leaves horizontal scrolling to the browser.
          if (list) return
          event.preventDefault()
          moveFocus(id, 1)
          return
        case "ArrowLeft":
          if (list) return
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
    [gap, layout.columns, layout.tileHeight, list, moveFocus, viewportHeight],
  )

  // The reading position to restore after a width change: which bucket is at
  // the top and how far into it the reader is.
  const anchorRef = React.useRef<{ index: number; fraction: number } | null>(
    null,
  )
  const previousWidthRef = React.useRef(contentWidth)
  // The layout currently committed to the DOM, for the measurement callback
  // below: at callback time React has not re-rendered yet, so the
  // render-scope `layout` of any later render must not be trusted there.
  const layoutRef = React.useRef(layout)
  React.useLayoutEffect(() => {
    layoutRef.current = layout
  }, [layout])

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const measure = () => {
      // The anchor must be captured here, before setContentWidth: any later
      // point — an effect, or an effect cleanup — runs inside the commit
      // that already gave the sizer its new height, after the browser has
      // clamped `element.scrollTop` into the new, possibly shorter range.
      // Only here is the scrollTop still the one belonging to the committed
      // layout in `layoutRef`.
      const committed = layoutRef.current
      if (committed.heights.length > 0) {
        const index = findBucketAtOffset(committed.offsets, element.scrollTop)
        const offset = committed.offsets[index] ?? 0
        const height = committed.heights[index] ?? 1
        anchorRef.current = {
          index,
          fraction: height > 0 ? (element.scrollTop - offset) / height : 0,
        }
      }
      setContentWidth(element.clientWidth)
      setViewportHeight(element.clientHeight)
      // Read separately from `contentWidth`: the rail's own width is what the
      // label breakpoint decides, so deriving the scroll area's width by
      // adding it back would be circular.
      const area = scrollAreaRef.current
      if (area) setScrollAreaWidth(area.clientWidth)
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const area = scrollAreaRef.current
    if (area) observer.observe(area)
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

  const scrollTo = React.useCallback((offset: number) => {
    const element = scrollRef.current
    if (!element) return
    // Assign, then read the value back. The browser is the single clamping
    // authority: computing a JavaScript clamp here and storing that would be a
    // second source of truth, which is exactly how the scrubber ended up
    // rendering an aria-valuenow above its own aria-valuemax in Task 5. An
    // out-of-range assignment is clamped by the DOM, and reading it back is
    // the only way to know what actually happened.
    element.scrollTop = offset
    setScrollTop(element.scrollTop)
  }, [])

  // Built independently of `useImperativeHandle`'s factory below rather than
  // inline inside it: that factory never runs when `ref` is null (React
  // skips it entirely), so the jump-to-date toolbar — which has no `ref` of
  // its own — closes over this instead, and works whether or not the
  // consumer passed one.
  const handle = React.useMemo<VirtualizedTimelineHandle>(
    () => ({
      scrollToDate: (date, opts) => {
        const target = toBucketDate(date).getTime()
        let best = 0
        let bestDelta = Infinity
        buckets.forEach((bucket, index) => {
          const delta = Math.abs(toBucketDate(bucket.date).getTime() - target)
          if (delta < bestDelta) {
            bestDelta = delta
            best = index
          }
        })
        const offset = layout.offsets[best] ?? 0
        scrollTo(
          opts?.align === "center"
            ? offset - (scrollRef.current?.clientHeight ?? 0) / 2
            : offset,
        )
      },
      scrollToBucket: (id, opts) => {
        const index = buckets.findIndex((bucket) => bucket.id === id)
        if (index < 0) return
        const offset = layout.offsets[index] ?? 0
        scrollTo(
          opts?.align === "center"
            ? offset - (scrollRef.current?.clientHeight ?? 0) / 2
            : offset,
        )
      },
      getVisibleBucketIds: () => {
        // Read live from the DOM rather than from state: the state copies
        // are rAF-throttled, and an imperative caller expects the answer as
        // of the call, not as of the last committed frame.
        const element = scrollRef.current
        if (!element) return []
        const top = element.scrollTop
        const bottom = top + element.clientHeight
        const ids: string[] = []
        buckets.forEach((bucket, index) => {
          const offset = layout.offsets[index]!
          const height = layout.heights[index]!
          if (offset < bottom && offset + height > top) ids.push(bucket.id)
        })
        return ids
      },
    }),
    [buckets, layout.heights, layout.offsets, scrollTo],
  )

  React.useImperativeHandle(ref, () => handle, [handle])

  // Restores the reading position recorded by the measurement callback
  // above: which bucket was at the top and how far into it the reader was,
  // rather than the raw pixel offset. Restoring is gated on the *width*
  // having actually changed (tracked via `previousWidthRef`): a collapse
  // should reflow in place, not reposition the viewport — only a width
  // change should move `scrollTop`.
  React.useLayoutEffect(() => {
    const element = scrollRef.current
    const anchor = anchorRef.current
    const widthChanged = previousWidthRef.current !== contentWidth
    previousWidthRef.current = contentWidth
    if (!element || !anchor || !widthChanged || layout.heights.length === 0) {
      return
    }
    const offset = layout.offsets[anchor.index] ?? 0
    const height = layout.heights[anchor.index] ?? 0
    element.scrollTop = offset + anchor.fraction * height
    setScrollTop(element.scrollTop)
    anchorRef.current = null
  }, [layout, contentWidth])

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

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (!list) return
    if (minTileWidthProp === undefined && tileAspectProp === undefined) return
    console.warn(
      '<VirtualizedTimeline> ignores minTileWidth and tileAspect when layout is "list". Set rowHeight instead.',
    )
  }, [list, minTileWidthProp, tileAspectProp])

  const renderBucketAt = (index: number): React.ReactNode => {
    const bucket = buckets[index]
    if (!bucket) return null
    const label = formatBucketLabel(bucket, granularity)
    const headerId = `${idBase}-header-${bucket.id}`
    // Named from the label span alone, not the whole header: the header div
    // also holds the checkbox and disclosure button, whose accessible names
    // would otherwise be absorbed into the group name ("Select July 2026
    // Collapse July 2026 July 2026") and mutate as they toggle.
    const labelId = `${headerId}-label`
    const height = layout.heights[index]!
    const collapsed = collapsedIds.has(bucket.id)
    const bucketSelection = selectable
      ? selection.bucketState(bucketIdsFor(bucket))
      : "none"
    return (
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
        layout={layoutProp}
        columns={layout.columns}
        tileHeight={layout.tileHeight}
        gap={gap}
        rowRange={timelineWindow.rows.get(index)}
        pinnedIndex={
          pinned && pinned.bucketIndex === index ? pinned.itemIndex : undefined
        }
        items={bucketItems.get(bucket.id).items}
        status={bucketItems.get(bucket.id).status}
        error={bucketItems.get(bucket.id).error}
        renderSkeleton={renderSkeleton}
        onRetry={() => bucketItems.retry(bucket.id)}
        getItemId={getItemId}
        renderItem={renderItem}
        renderBucket={renderBucket}
        contentWidth={contentWidth}
        labelId={labelId}
        onItemClick={onItemClick}
        selectable={selectable}
        selection={selection}
        activeId={tabStopId}
        onItemKeyDown={handleItemKeyDown}
        onFocusItem={focusItem}
        onItemFocus={(id) => setActive(id, bucket.id)}
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
            <span id={labelId}>
              {renderBucketHeader
                ? renderBucketHeader({
                    bucket,
                    label,
                    collapsed,
                    selection: bucketSelection,
                  })
                : label}
            </span>
          </div>
        }
      />
    )
  }

  // Load-bearing, not defensive: before the first measurement, viewportHeight
  // is still 0 while useBucketLayout's unmeasured fallback already gives
  // every bucket a header plus spacing, so maxScroll is positive on frame
  // one for almost any dataset. Without this guard the rail mounts, then
  // unmounts once contentWidth arrives, widening the flex-1 viewport and
  // triggering a second ResizeObserver correction — a flash plus a reflow
  // where "nothing to scrub" should render nothing at all. jsdom can't catch
  // this: its clientWidth stub is a constant unaffected by DOM structure, so
  // no unit test can stand in for the browser pass that verifies it.
  const measured = contentWidth > 0
  const maxScroll = Math.max(0, layout.totalSize - viewportHeight)

  const mounted: React.ReactNode[] = []
  // A pinned bucket above the window precedes it so DOM order matches
  // visual order.
  if (pinned && pinned.bucketIndex < timelineWindow.startIndex) {
    mounted.push(renderBucketAt(pinned.bucketIndex))
  }
  for (
    let index = timelineWindow.startIndex;
    index <= timelineWindow.endIndex;
    index += 1
  ) {
    mounted.push(renderBucketAt(index))
  }
  if (pinned && pinned.bucketIndex > timelineWindow.endIndex) {
    mounted.push(renderBucketAt(pinned.bucketIndex))
  }

  return (
    <div
      className={cn("dr-virtualized-timeline", className)}
      data-scrubber-side={scrubberSide}
      // The consumer's style spreads after the variables, but must never
      // replace the object wholesale: the tile CSS resolves its size from
      // these variables, and a plain `style={{ height: 500 }}` would
      // otherwise collapse every tile to 0x0.
      style={
        {
          "--vtimeline-tile-width": `${layout.tileWidth}px`,
          "--vtimeline-tile-height": `${layout.tileHeight}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {showJumpToDate ? (
        <div className="dr-virtualized-timeline-toolbar">
          <VirtualizedTimelineJumpToDate
            onJump={(date) => handle.scrollToDate(date)}
          />
        </div>
      ) : null}
      {/* Positions the scrubber against the scrollable area alone rather than
          the whole component, so the rail's flex row never competes with the
          toolbar's band above it. */}
      <div className="dr-virtualized-timeline-scroll-area" ref={scrollAreaRef}>
        {/* Must render unconditionally: the measurement effects above run
            once, right after the first commit, with an empty dependency
            array. If this element were absent on that first commit (e.g.
            because `buckets` started empty), `scrollRef` would stay null
            forever and the component would never measure itself even after
            buckets arrives on a later render. */}
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
        {/* A date index over a range of zero indexes nothing, and leaving it
            mounted leaves a focusable slider that cannot move. */}
        {showScrubber && measured && maxScroll > 0 ? (
          <VirtualizedTimelineScrubber<T>
            buckets={buckets}
            layout={layout}
            granularity={granularity}
            scrollTop={scrollTop}
            viewportHeight={viewportHeight}
            maxScroll={maxScroll}
            railHeight={viewportHeight}
            showLabels={scrollAreaWidth >= RAIL_LABEL_BREAKPOINT}
            onScrubTo={scrollTo}
          />
        ) : null}
      </div>
    </div>
  )
}
