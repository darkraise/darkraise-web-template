import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useEvent } from "./useEvent"

describe("useEvent", () => {
  it("keeps a stable function identity across renders", () => {
    const { result, rerender } = renderHook(
      ({ fn }: { fn: (n: number) => number }) => useEvent(fn),
      { initialProps: { fn: (n) => n + 1 } },
    )
    const first = result.current
    rerender({ fn: (n) => n + 2 })
    expect(result.current).toBe(first)
  })

  it("invokes the latest provided function", () => {
    const a = vi.fn((n: number) => n + 1)
    const b = vi.fn((n: number) => n + 2)
    const { result, rerender } = renderHook(
      ({ fn }: { fn: (n: number) => number }) => useEvent(fn),
      { initialProps: { fn: a } },
    )
    expect(result.current(1)).toBe(2)
    expect(a).toHaveBeenCalledTimes(1)
    rerender({ fn: b })
    expect(result.current(1)).toBe(3)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it("forwards arguments and return values", () => {
    const fn = vi.fn((a: string, b: number) => `${a}-${b}`)
    const { result } = renderHook(() => useEvent(fn))
    expect(result.current("x", 7)).toBe("x-7")
    expect(fn).toHaveBeenCalledWith("x", 7)
  })
})
