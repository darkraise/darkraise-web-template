import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useRafCallback } from "./useRafCallback"

describe("useRafCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("calls the callback once, on the next frame, with the last arguments", () => {
    const cb = vi.fn((label: string, n: number) => `${label}${n}`)
    const { result } = renderHook(() => useRafCallback(cb))
    result.current[0]("first", 1)
    result.current[0]("second", 2)
    expect(cb).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith("second", 2)
  })

  it("calls the callback of the latest render", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useRafCallback(cb), {
      initialProps: { cb: first },
    })
    result.current[0]()
    rerender({ cb: second })
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("drops the pending frame on cancel and on unmount", () => {
    const cb = vi.fn()
    const { result, unmount } = renderHook(() => useRafCallback(cb))
    result.current[0]()
    result.current[1]()
    act(() => {
      vi.advanceTimersToNextFrame()
    })
    expect(cb).not.toHaveBeenCalled()

    result.current[0]()
    unmount()
    vi.advanceTimersToNextFrame()
    expect(cb).not.toHaveBeenCalled()
  })

  it("returns stable functions named after the first callback", () => {
    function onFrame(a: number, b: number) {
      return a + b
    }
    const { result, rerender } = renderHook(({ cb }) => useRafCallback(cb), {
      initialProps: { cb: onFrame },
    })
    const [wrapped, cancel] = result.current
    rerender({ cb: (a: number, b: number) => a - b })
    expect(result.current[0]).toBe(wrapped)
    expect(result.current[1]).toBe(cancel)
    expect(wrapped.name).toBe("onFrame__raf")
    expect(wrapped.length).toBe(2)
  })

  it("names the wrapper anonymous__raf for an anonymous callback", () => {
    const { result } = renderHook(() => useRafCallback(() => {}))
    expect(result.current[0].name).toMatch(/__raf$/)
    const { result: unnamed } = renderHook(() =>
      useRafCallback(Object.defineProperty(() => {}, "name", { value: "" })),
    )
    expect(unnamed.current[0].name).toBe("anonymous__raf")
  })
})
