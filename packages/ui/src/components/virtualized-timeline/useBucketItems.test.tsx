import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useBucketItems } from "./useBucketItems"
import type { TimelineBucket } from "./types"

interface Photo {
  id: string
}

const buckets: TimelineBucket<Photo>[] = [
  { id: "a", date: "2026-07-01", count: 2 },
  { id: "b", date: "2026-06-01", count: 2 },
  { id: "c", date: "2026-05-01", count: 2, items: [{ id: "inline" }] },
]

function itemsFor(id: string): Photo[] {
  return [{ id: `${id}-0` }, { id: `${id}-1` }]
}

describe("useBucketItems", () => {
  it("loads the buckets in the window and reports their status", async () => {
    const loadBucket = vi.fn(async (b: TimelineBucket<Photo>) => itemsFor(b.id))
    const { result } = renderHook(() =>
      useBucketItems<Photo>({
        buckets,
        windowIndices: [0],
        loadBucket,
        maxLoadedBuckets: 12,
      }),
    )
    await waitFor(() => expect(result.current.get("a").status).toBe("loaded"))
    expect(result.current.get("a").items).toEqual(itemsFor("a"))
    expect(loadBucket).toHaveBeenCalledTimes(1)
  })

  it("never calls the loader for a bucket carrying inline items", async () => {
    const loadBucket = vi.fn(async () => [])
    const { result } = renderHook(() =>
      useBucketItems<Photo>({
        buckets,
        windowIndices: [2],
        loadBucket,
        maxLoadedBuckets: 12,
      }),
    )
    expect(result.current.get("c").status).toBe("loaded")
    expect(result.current.get("c").items).toEqual([{ id: "inline" }])
    expect(loadBucket).not.toHaveBeenCalled()
  })

  it("de-duplicates concurrent loads of the same bucket", async () => {
    const loadBucket = vi.fn(async (b: TimelineBucket<Photo>) => itemsFor(b.id))
    const { result, rerender } = renderHook(
      ({ indices }: { indices: number[] }) =>
        useBucketItems<Photo>({
          buckets,
          windowIndices: indices,
          loadBucket,
          maxLoadedBuckets: 12,
        }),
      { initialProps: { indices: [0] } },
    )
    rerender({ indices: [0, 1] })
    await waitFor(() => expect(result.current.get("b").status).toBe("loaded"))
    expect(loadBucket).toHaveBeenCalledTimes(2)
    expect(loadBucket.mock.calls.map(([b]) => b.id)).toEqual(["a", "b"])
  })

  it("evicts the least recently seen bucket past the cap", async () => {
    const loadBucket = vi.fn(async (b: TimelineBucket<Photo>) => itemsFor(b.id))
    const { result, rerender } = renderHook(
      ({ indices }: { indices: number[] }) =>
        useBucketItems<Photo>({
          buckets,
          windowIndices: indices,
          loadBucket,
          maxLoadedBuckets: 1,
        }),
      { initialProps: { indices: [0] } },
    )
    await waitFor(() => expect(result.current.get("a").status).toBe("loaded"))
    rerender({ indices: [1] })
    await waitFor(() => expect(result.current.get("b").status).toBe("loaded"))
    expect(result.current.get("a").status).toBe("idle")
  })

  it("discards a resolution for a bucket evicted while its load was in flight", async () => {
    let resolveA: ((items: Photo[]) => void) | undefined
    const loadBucket = vi.fn((b: TimelineBucket<Photo>) => {
      if (b.id === "a") {
        return new Promise<Photo[]>((resolve) => {
          resolveA = resolve
        })
      }
      return Promise.resolve(itemsFor(b.id))
    })
    const { result, rerender } = renderHook(
      ({ indices }: { indices: number[] }) =>
        useBucketItems<Photo>({
          buckets,
          windowIndices: indices,
          loadBucket,
          maxLoadedBuckets: 1,
        }),
      { initialProps: { indices: [0] } },
    )
    await waitFor(() => expect(result.current.get("a").status).toBe("loading"))
    rerender({ indices: [1] })
    await waitFor(() => expect(result.current.get("b").status).toBe("loaded"))
    expect(result.current.get("a").status).toBe("idle")
    await act(async () => {
      resolveA?.(itemsFor("a"))
    })
    expect(result.current.get("a").status).toBe("idle")
  })

  it("surfaces a rejection and reports it", async () => {
    const error = new Error("offline")
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useBucketItems<Photo>({
        buckets,
        windowIndices: [0],
        loadBucket: async () => {
          throw error
        },
        maxLoadedBuckets: 12,
        onError,
      }),
    )
    await waitFor(() => expect(result.current.get("a").status).toBe("error"))
    expect(result.current.get("a").error).toBe(error)
    expect(onError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ id: "a" }),
    )
  })

  it("retries a failed bucket", async () => {
    let attempt = 0
    const loadBucket = vi.fn(async (b: TimelineBucket<Photo>) => {
      attempt += 1
      if (attempt === 1) throw new Error("first try")
      return itemsFor(b.id)
    })
    const { result } = renderHook(() =>
      useBucketItems<Photo>({
        buckets,
        windowIndices: [0],
        loadBucket,
        maxLoadedBuckets: 12,
      }),
    )
    await waitFor(() => expect(result.current.get("a").status).toBe("error"))
    await act(async () => {
      result.current.retry("a")
    })
    await waitFor(() => expect(result.current.get("a").status).toBe("loaded"))
  })

  it("resolves ensure() for a bucket outside the window", async () => {
    const loadBucket = vi.fn(async (b: TimelineBucket<Photo>) => itemsFor(b.id))
    const { result } = renderHook(() =>
      useBucketItems<Photo>({
        buckets,
        windowIndices: [],
        loadBucket,
        maxLoadedBuckets: 12,
      }),
    )
    let items: Photo[] | undefined
    await act(async () => {
      items = await result.current.ensure("b")
    })
    expect(items).toEqual(itemsFor("b"))
  })
})
