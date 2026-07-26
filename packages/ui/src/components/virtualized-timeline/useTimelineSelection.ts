"use client"

import * as React from "react"

import { useControllableState } from "@primitives/state"
import { contentKey } from "./contentKey"

export type BucketSelectionState = "none" | "some" | "all"

export interface UseTimelineSelectionOptions {
  /** Flat, ordered ids of every item currently loaded, in bucket order. */
  orderedIds: string[]
  selectedIds?: Iterable<string>
  defaultSelectedIds?: Iterable<string>
  onSelectionChange?: (ids: string[]) => void
}

export interface TimelineSelection {
  selected: ReadonlySet<string>
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  extendTo: (id: string) => void
  setBucket: (ids: string[], selected: boolean) => void
  bucketState: (ids: string[]) => BucketSelectionState
  clear: () => void
}

export function useTimelineSelection({
  orderedIds,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
}: UseTimelineSelectionOptions): TimelineSelection {
  // Memoize based on content, not iterable identity. This ensures that new
  // array literals with the same contents produce the same memoized value,
  // avoiding loops in useControllableState's mirroring effect, which depends
  // on the `value` prop's identity. See `contentKey.ts` for why the key is
  // built the way it is.
  const selectedKey = selectedIds ? contentKey(selectedIds) : undefined
  const stableSelectedIds = React.useMemo(
    () => (selectedIds ? Array.from(selectedIds) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on contents, not iterable identity
    [selectedKey],
  )

  const [ids, setIds] = useControllableState<string[]>({
    value: stableSelectedIds,
    defaultValue: defaultSelectedIds ? [...defaultSelectedIds] : [],
    onChange: onSelectionChange,
  })

  const selected = React.useMemo(() => new Set(ids ?? []), [ids])
  const anchor = React.useRef<string | null>(null)

  const toggle = React.useCallback(
    (id: string) => {
      anchor.current = id
      setIds((prev) => {
        const next = new Set(prev ?? [])
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return [...next]
      })
    },
    [setIds],
  )

  // The anchor deliberately does not move, so successive shift-clicks resize
  // one range instead of chaining new ones.
  const extendTo = React.useCallback(
    (id: string) => {
      const from = anchor.current
      if (from === null) {
        toggle(id)
        return
      }
      const start = orderedIds.indexOf(from)
      const end = orderedIds.indexOf(id)
      if (start < 0 || end < 0) return
      const [low, high] = start <= end ? [start, end] : [end, start]
      setIds(orderedIds.slice(low, high + 1))
    },
    [orderedIds, setIds, toggle],
  )

  const setBucket = React.useCallback(
    (bucketIds: string[], nextSelected: boolean) => {
      setIds((prev) => {
        const next = new Set(prev ?? [])
        for (const id of bucketIds) {
          if (nextSelected) next.add(id)
          else next.delete(id)
        }
        return [...next]
      })
    },
    [setIds],
  )

  const bucketState = React.useCallback(
    (bucketIds: string[]): BucketSelectionState => {
      if (bucketIds.length === 0) return "none"
      let hit = 0
      for (const id of bucketIds) if (selected.has(id)) hit += 1
      if (hit === 0) return "none"
      return hit === bucketIds.length ? "all" : "some"
    },
    [selected],
  )

  const clear = React.useCallback(() => setIds([]), [setIds])

  return {
    selected,
    isSelected: React.useCallback((id) => selected.has(id), [selected]),
    toggle,
    extendTo,
    setBucket,
    bucketState,
    clear,
  }
}
