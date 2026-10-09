import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useList } from "./useList"

describe("useList", () => {
  it("starts from the initial list or the initialiser's result", () => {
    const { result } = renderHook(() => useList([1, 2]))
    expect(result.current[0]).toEqual([1, 2])
    const { result: lazy } = renderHook(() => useList(() => [3]))
    expect(lazy.current[0]).toEqual([3])
  })

  it("returns the same list and actions while nothing changes", () => {
    const { result, rerender } = renderHook(() => useList([1]))
    const [list, actions] = result.current
    rerender()
    expect(result.current[0]).toBe(list)
    expect(result.current[1]).toBe(actions)
  })

  it("applies each action and re-renders with the new list", () => {
    const { result } = renderHook(() => useList([3, 1]))
    const act1 = (fn: () => void) => {
      act(fn)
      return result.current[0]
    }
    expect(act1(() => result.current[1].push(2))).toEqual([3, 1, 2])
    expect(act1(() => result.current[1].sort())).toEqual([1, 2, 3])
    expect(act1(() => result.current[1].updateAt(0, 9))).toEqual([9, 2, 3])
    expect(act1(() => result.current[1].insertAt(1, 8))).toEqual([9, 8, 2, 3])
    expect(act1(() => result.current[1].insertAt(6, 7))).toEqual([
      9,
      8,
      2,
      3,
      undefined,
      undefined,
      7,
    ])
    expect(
      act1(() => result.current[1].filter((n) => n !== undefined)),
    ).toEqual([9, 8, 2, 3, 7])
    expect(act1(() => result.current[1].removeAt(0))).toEqual([8, 2, 3, 7])
    expect(
      act1(() => result.current[1].update((item, next) => item > next, 5)),
    ).toEqual([5, 2, 3, 5])
    expect(
      act1(() =>
        result.current[1].updateFirst(
          (item, next) => item === 5 && next === 6,
          6,
        ),
      ),
    ).toEqual([6, 2, 3, 5])
    expect(
      act1(() => result.current[1].upsert((item, next) => item === next, 4)),
    ).toEqual([6, 2, 3, 5, 4])
    expect(
      act1(() => result.current[1].upsert((item) => item === 2, 20)),
    ).toEqual([6, 20, 3, 5, 4])
    expect(act1(() => result.current[1].set((list) => [...list, 1]))).toEqual([
      6, 20, 3, 5, 4, 1,
    ])
    expect(act1(() => result.current[1].clear())).toEqual([])
  })

  it("lets later actions in the same handler see earlier ones", () => {
    const { result } = renderHook(() => useList<number>([]))
    act(() => {
      result.current[1].push(1)
      result.current[1].upsert((item, next) => item === next, 1)
      result.current[1].updateFirst((item) => item === 1, 2)
    })
    expect(result.current[0]).toEqual([2])
  })

  it("resets to the initial list of the latest render", () => {
    const { result, rerender } = renderHook(({ initial }) => useList(initial), {
      initialProps: { initial: [1] },
    })
    act(() => {
      result.current[1].push(2)
    })
    rerender({ initial: [7, 8] })
    expect(result.current[0]).toEqual([1, 2])
    act(() => {
      result.current[1].reset()
    })
    expect(result.current[0]).toEqual([7, 8])
  })

  it("resets to a fresh copy of the initialiser's result", () => {
    const init = vi.fn(() => [1])
    const { result } = renderHook(() => useList(init))
    const first = result.current[0]
    act(() => {
      result.current[1].reset()
    })
    expect(result.current[0]).toEqual([1])
    expect(result.current[0]).not.toBe(first)
  })
})
