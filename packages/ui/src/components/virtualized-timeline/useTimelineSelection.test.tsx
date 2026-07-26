import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTimelineSelection } from "./useTimelineSelection"

const orderedIds = ["a1", "a2", "a3", "b1", "b2"]

describe("useTimelineSelection", () => {
  it("toggles an item on and off", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.toggle("a2"))
    expect(result.current.isSelected("a2")).toBe(true)
    act(() => result.current.toggle("a2"))
    expect(result.current.isSelected("a2")).toBe(false)
  })

  it("extends a range from the anchor set by the last plain toggle", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.toggle("a2"))
    act(() => result.current.extendTo("b1"))
    expect([...result.current.selected].sort()).toEqual(["a2", "a3", "b1"])
  })

  it("leaves the anchor in place so successive extends resize one range", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.toggle("a2"))
    act(() => result.current.extendTo("b2"))
    act(() => result.current.extendTo("a3"))
    expect([...result.current.selected].sort()).toEqual(["a2", "a3"])
  })

  it("extends backwards", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.toggle("b1"))
    act(() => result.current.extendTo("a2"))
    expect([...result.current.selected].sort()).toEqual(["a2", "a3", "b1"])
  })

  it("ignores ids missing from the ordered list, which is how unloaded buckets behave", () => {
    const { result } = renderHook(() =>
      useTimelineSelection({ orderedIds: ["a1", "b2"] }),
    )
    act(() => result.current.toggle("a1"))
    act(() => result.current.extendTo("b2"))
    expect([...result.current.selected].sort()).toEqual(["a1", "b2"])
  })

  it("reports a bucket as none, some, or all", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    const bucket = ["a1", "a2", "a3"]
    expect(result.current.bucketState(bucket)).toBe("none")
    act(() => result.current.toggle("a1"))
    expect(result.current.bucketState(bucket)).toBe("some")
    act(() => result.current.setBucket(bucket, true))
    expect(result.current.bucketState(bucket)).toBe("all")
  })

  it("treats an unloaded bucket with no known ids as none", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    expect(result.current.bucketState([])).toBe("none")
  })

  it("clears a bucket without touching other selections", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.setBucket(["a1", "a2"], true))
    act(() => result.current.toggle("b1"))
    act(() => result.current.setBucket(["a1", "a2"], false))
    expect([...result.current.selected]).toEqual(["b1"])
  })

  it("stays controlled when selectedIds is passed", () => {
    const onSelectionChange = vi.fn()
    const { result } = renderHook(() =>
      useTimelineSelection({
        orderedIds,
        selectedIds: ["a1"],
        onSelectionChange,
      }),
    )
    act(() => result.current.toggle("a2"))
    expect(onSelectionChange).toHaveBeenCalledWith(["a1", "a2"])
    // The controlled prop did not change, so neither did the reported selection.
    expect([...result.current.selected]).toEqual(["a1"])
  })

  it("clears everything", () => {
    const { result } = renderHook(() => useTimelineSelection({ orderedIds }))
    act(() => result.current.setBucket(orderedIds, true))
    act(() => result.current.clear())
    expect(result.current.selected.size).toBe(0)
  })

  it("distinguishes selections that would collide with a space separator", () => {
    // Collision case: space separator makes ["a b", "c"] and ["a", "b c"] both key to "a b c"
    // NUL separator avoids this since NUL cannot appear in ids
    const idsWithSpaces = ["a b", "c", "a", "b c", "d"]
    const { result, rerender } = renderHook(
      ({ selectedIds }) =>
        useTimelineSelection({
          orderedIds: idsWithSpaces,
          selectedIds,
        }),
      { initialProps: { selectedIds: ["a b", "c"] } },
    )
    expect([...result.current.selected].sort()).toEqual(["a b", "c"])
    rerender({ selectedIds: ["a", "b c"] })
    expect([...result.current.selected].sort()).toEqual(["a", "b c"])
  })
})
