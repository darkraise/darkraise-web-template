"use client"

import * as React from "react"

import { useEvent } from "@primitives/state"
import type { BucketStatus, TimelineBucket } from "./types"

export interface BucketEntry<T> {
  status: BucketStatus
  items?: T[]
  error?: unknown
}

export interface UseBucketItemsOptions<T> {
  buckets: TimelineBucket<T>[]
  /** Bucket indices to keep loaded. */
  windowIndices: number[]
  loadBucket?: (bucket: TimelineBucket<T>) => Promise<T[]>
  maxLoadedBuckets: number
  onError?: (error: unknown, bucket: TimelineBucket<T>) => void
}

export interface UseBucketItemsReturn<T> {
  get: (id: string) => BucketEntry<T>
  ensure: (id: string) => Promise<T[] | undefined>
  retry: (id: string) => void
}

const IDLE: BucketEntry<never> = { status: "idle" }

export function useBucketItems<T>({
  buckets,
  windowIndices,
  loadBucket,
  maxLoadedBuckets,
  onError,
}: UseBucketItemsOptions<T>): UseBucketItemsReturn<T> {
  const [entries, setEntries] = React.useState<Map<string, BucketEntry<T>>>(
    () => new Map(),
  )
  const inFlight = React.useRef(new Map<string, Promise<T[] | undefined>>())
  const lastSeen = React.useRef(new Map<string, number>())
  const clock = React.useRef(0)

  const byId = React.useMemo(() => {
    const map = new Map<string, TimelineBucket<T>>()
    for (const bucket of buckets) map.set(bucket.id, bucket)
    return map
  }, [buckets])

  const reportError = useEvent((error: unknown, bucket: TimelineBucket<T>) => {
    onError?.(error, bucket)
  })

  const start = useEvent((id: string): Promise<T[] | undefined> => {
    const bucket = byId.get(id)
    if (!bucket) return Promise.resolve(undefined)
    if (bucket.items) return Promise.resolve(bucket.items)
    const existing = inFlight.current.get(id)
    if (existing) return existing
    if (!loadBucket) return Promise.resolve(undefined)

    setEntries((prev) => new Map(prev).set(id, { status: "loading" }))
    const promise = loadBucket(bucket)
      .then((items) => {
        inFlight.current.delete(id)
        setEntries((prev) => {
          // A bucket evicted while its load was in flight must not come back.
          if (!lastSeen.current.has(id)) return prev
          return new Map(prev).set(id, { status: "loaded", items })
        })
        return items
      })
      .catch((error: unknown) => {
        inFlight.current.delete(id)
        setEntries((prev) => new Map(prev).set(id, { status: "error", error }))
        reportError(error, bucket)
        return undefined
      })
    inFlight.current.set(id, promise)
    return promise
  })

  // Loads what the window needs and evicts what it has not needed for longest.
  React.useEffect(() => {
    clock.current += 1
    const tick = clock.current
    const wanted: string[] = []
    for (const index of windowIndices) {
      const bucket = buckets[index]
      if (!bucket) continue
      wanted.push(bucket.id)
      lastSeen.current.set(bucket.id, tick)
      const entry = entries.get(bucket.id)
      if (!bucket.items && (!entry || entry.status === "idle")) {
        void start(bucket.id)
      }
    }

    if (!Number.isFinite(maxLoadedBuckets)) return
    const live = [...lastSeen.current.entries()].filter(
      ([id]) => !wanted.includes(id),
    )
    const overflow = lastSeen.current.size - maxLoadedBuckets
    if (overflow <= 0) return
    live.sort((a, b) => a[1] - b[1])
    const evicted = live.slice(0, overflow).map(([id]) => id)
    if (evicted.length === 0) return
    for (const id of evicted) lastSeen.current.delete(id)
    setEntries((prev) => {
      const next = new Map(prev)
      for (const id of evicted) next.delete(id)
      return next
    })
    // `entries` is read but must not retrigger this effect: it changes on every
    // load, and re-running on that would re-evaluate eviction mid-load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buckets, windowIndices, maxLoadedBuckets, start])

  const get = React.useCallback(
    (id: string): BucketEntry<T> => {
      const bucket = byId.get(id)
      if (bucket?.items) return { status: "loaded", items: bucket.items }
      return entries.get(id) ?? (IDLE as BucketEntry<T>)
    },
    [byId, entries],
  )

  const ensure = useEvent((id: string) => start(id))

  const retry = useEvent((id: string) => {
    setEntries((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    void start(id)
  })

  return { get, ensure, retry }
}
