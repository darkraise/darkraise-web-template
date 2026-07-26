"use client"

import * as React from "react"

import { useControllableState } from "@primitives/state"

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
  const cachedSelectedIds = React.useRef<string[] | undefined>(undefined)
  const cachedDefaultIds = React.useRef<string[]>([])

  // Cache arrays by content to avoid creating new objects on each render.
  // This is necessary for controlled mode where the Iterable might be a new
  // array literal with the same contents on each render.
  const selectedIdsToPass = React.useMemo(() => {
    const next = selectedIds ? [...selectedIds] : undefined
    // eslint-disable-next-line react-hooks/refs
    if (!arrayContentsEqual(cachedSelectedIds.current, next)) {
      // eslint-disable-next-line react-hooks/refs
      cachedSelectedIds.current = next
    }
    // eslint-disable-next-line react-hooks/refs
    return cachedSelectedIds.current
  }, [selectedIds])

  const defaultIdsToPass = React.useMemo(() => {
    const next = defaultSelectedIds ? [...defaultSelectedIds] : []
    // eslint-disable-next-line react-hooks/refs
    if (!arrayContentsEqual(cachedDefaultIds.current, next)) {
      // eslint-disable-next-line react-hooks/refs
      cachedDefaultIds.current = next
    }
    // eslint-disable-next-line react-hooks/refs
    return cachedDefaultIds.current
  }, [defaultSelectedIds])

  // eslint-disable-next-line react-hooks/refs
  const [ids, setIds] = useControllableState<string[]>({
    value: selectedIdsToPass,
    defaultValue: defaultIdsToPass,
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

function arrayContentsEqual(
  a: string[] | undefined,
  b: string[] | undefined,
): boolean {
  if (a === b) return true
  if (!a || !b) return a === b
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
