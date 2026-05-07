"use client"

import * as React from "react"

export interface VirtualItem {
  index: number
  start: number
  size: number
  /** Stable per-item key. Equal to `index` for fixed-height. */
  key: number
}

export interface UseVirtualizerOptions {
  count: number
  /** Fixed height (in px) for every item. */
  itemHeight: number
  getScrollElement: () => HTMLElement | null
  /** Items rendered outside the visible window on each side. Defaults to 4. */
  overscan?: number
}

export interface UseVirtualizerReturn {
  virtualItems: VirtualItem[]
  totalSize: number
  /** Scroll the virtualizer to a given item index, aligning to nearest edge. */
  scrollToIndex: (
    index: number,
    opts?: { align?: "auto" | "start" | "end" },
  ) => void
  /** Force the virtualizer to recompute (rare; usually scroll/resize handle it). */
  measure: () => void
}

export function useVirtualizer({
  count,
  itemHeight,
  getScrollElement,
  overscan = 4,
}: UseVirtualizerOptions): UseVirtualizerReturn {
  const [tick, setTick] = React.useState(0)
  const measure = React.useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  React.useEffect(() => {
    const el = getScrollElement()
    if (!el) return
    const onScroll = () => measure()
    const onResize = () => measure()
    el.addEventListener("scroll", onScroll, { passive: true })
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(onResize)
      ro.observe(el)
      return () => {
        el.removeEventListener("scroll", onScroll)
        ro.disconnect()
      }
    }
    window.addEventListener("resize", onResize)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [getScrollElement, measure])

  const result = React.useMemo<UseVirtualizerReturn>(() => {
    const el = getScrollElement()
    const totalSize = count * itemHeight
    if (!el || count === 0) {
      return {
        virtualItems: [],
        totalSize,
        scrollToIndex: () => {},
        measure,
      }
    }
    const scrollTop = el.scrollTop
    const viewport = el.clientHeight
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIdx = Math.min(
      count - 1,
      Math.ceil((scrollTop + viewport) / itemHeight) + overscan,
    )
    const items: VirtualItem[] = []
    for (let i = startIdx; i <= endIdx; i += 1) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
        key: i,
      })
    }
    const scrollToIndex = (
      index: number,
      opts?: { align?: "auto" | "start" | "end" },
    ) => {
      const target = el
      if (!target) return
      const align = opts?.align ?? "auto"
      const itemTop = index * itemHeight
      const itemBottom = itemTop + itemHeight
      const top = target.scrollTop
      const bottom = top + target.clientHeight
      if (align === "start") {
        target.scrollTop = itemTop
      } else if (align === "end") {
        target.scrollTop = itemBottom - target.clientHeight
      } else {
        if (itemTop < top) target.scrollTop = itemTop
        else if (itemBottom > bottom)
          target.scrollTop = itemBottom - target.clientHeight
      }
    }
    return {
      virtualItems: items,
      totalSize,
      scrollToIndex,
      measure,
    }
    // tick triggers a recompute when scroll/resize fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, itemHeight, overscan, tick, getScrollElement, measure])

  return result
}
