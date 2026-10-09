import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useFirstMountState } from "./useFirstMountState"
import { usePrevious } from "./usePrevious"
import { usePreviousDistinct } from "./usePreviousDistinct"

describe("usePrevious", () => {
  it("returns undefined on the first render", () => {
    const { result } = renderHook(() => usePrevious("a"))
    expect(result.current).toBeUndefined()
  })

  it("returns the value of the previous render", () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), {
      initialProps: { v: "a" },
    })
    rerender({ v: "b" })
    expect(result.current).toBe("a")
    rerender({ v: "c" })
    expect(result.current).toBe("b")
  })

  it("returns the unchanged value after a render that did not change it", () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), {
      initialProps: { v: "a" },
    })
    rerender({ v: "b" })
    rerender({ v: "b" })
    expect(result.current).toBe("b")
  })
})

describe("usePreviousDistinct", () => {
  it("returns undefined until a second distinct value has committed", () => {
    const { result, rerender } = renderHook(({ v }) => usePreviousDistinct(v), {
      initialProps: { v: "a" },
    })
    expect(result.current).toBeUndefined()
    rerender({ v: "b" })
    expect(result.current).toBeUndefined()
    rerender({ v: "b" })
    expect(result.current).toBe("a")
  })

  it("keeps the previous distinct value across renders that repeat a value", () => {
    const { result, rerender } = renderHook(({ v }) => usePreviousDistinct(v), {
      initialProps: { v: "a" },
    })
    rerender({ v: "b" })
    rerender({ v: "b" })
    rerender({ v: "b" })
    expect(result.current).toBe("a")
    rerender({ v: "c" })
    expect(result.current).toBe("a")
    rerender({ v: "c" })
    expect(result.current).toBe("b")
  })

  it("uses the comparator to decide what counts as distinct", () => {
    const sameInitial = (prev: string | undefined, next: string) =>
      prev?.[0] === next[0]
    const { result, rerender } = renderHook(
      ({ v }) => usePreviousDistinct(v, sameInitial),
      { initialProps: { v: "apple" } },
    )
    rerender({ v: "avocado" })
    rerender({ v: "banana" })
    rerender({ v: "banana" })
    expect(result.current).toBe("apple")
  })
})

describe("useFirstMountState", () => {
  it("is true on the first render only", () => {
    const { result, rerender } = renderHook(() => useFirstMountState())
    expect(result.current).toBe(true)
    rerender()
    expect(result.current).toBe(false)
    rerender()
    expect(result.current).toBe(false)
  })

  it("does not render again after mounting", () => {
    const seen: boolean[] = []
    renderHook(() => {
      const isFirst = useFirstMountState()
      seen.push(isFirst)
      return isFirst
    })
    expect(seen).toEqual([true])
  })
})
