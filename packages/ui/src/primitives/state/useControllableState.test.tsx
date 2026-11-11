import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useControllableState } from "./useControllableState"

describe("useControllableState", () => {
  it("uses defaultValue as initial state when uncontrolled", () => {
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: 5 }),
    )
    expect(result.current[0]).toBe(5)
  })

  it("returns the controlled value, ignoring defaultValue", () => {
    const { result } = renderHook(() =>
      useControllableState<number>({ value: 9, defaultValue: 5 }),
    )
    expect(result.current[0]).toBe(9)
  })

  it("setter updates internal state when uncontrolled", () => {
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: 1 }),
    )
    act(() => result.current[1](2))
    expect(result.current[0]).toBe(2)
  })

  it("setter calls onChange but does not mutate state when controlled", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<number>({ value: 1, onChange }),
    )
    act(() => result.current[1](7))
    expect(result.current[0]).toBe(1) // still controlled
    expect(onChange).toHaveBeenCalledWith(7)
  })

  it("setter accepts an updater function", () => {
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: 10 }),
    )
    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(15)
  })

  it("setting the current value calls no onChange", () => {
    const onChange = vi.fn()
    const controlled = renderHook(() =>
      useControllableState<boolean>({ value: false, onChange }),
    )
    act(() => controlled.result.current[1](false))
    const uncontrolled = renderHook(() =>
      useControllableState<boolean>({ defaultValue: false, onChange }),
    )
    act(() => uncontrolled.result.current[1]((prev) => prev))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("two sets in one tick each compare against the one before", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<boolean>({ defaultValue: false, onChange }),
    )
    act(() => {
      result.current[1](true)
      result.current[1](false)
    })
    expect(result.current[0]).toBe(false)
    expect(onChange.mock.calls).toEqual([[true], [false]])
  })

  it("a setter kept from an earlier render compares against the latest value", () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<boolean>({ defaultValue: false, onChange }),
    )
    const kept = result.current[1]
    act(() => result.current[1](true))
    act(() => kept(false))
    expect(result.current[0]).toBe(false)
    expect(onChange.mock.calls).toEqual([[true], [false]])
  })

  it("updaters in one tick compose", () => {
    const { result } = renderHook(() =>
      useControllableState<number>({ defaultValue: 0 }),
    )
    act(() => {
      result.current[1]((prev) => prev + 1)
      result.current[1]((prev) => prev + 1)
    })
    expect(result.current[0]).toBe(2)
  })

  it("a controlled owner that kept its value is asked again on a later set", async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState<boolean>({ value: true, onChange }),
    )
    act(() => result.current[1](false))
    await act(async () => {})
    act(() => result.current[1](false))
    expect(onChange.mock.calls).toEqual([[false], [false]])
  })

  it("does not switch modes when value goes from defined to undefined mid-life", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value?: number }) =>
        useControllableState<number>({ value, defaultValue: 0 }),
      { initialProps: { value: 5 } as { value?: number } },
    )
    expect(result.current[0]).toBe(5)
    rerender({ value: undefined })
    expect(result.current[0]).toBe(5) // last controlled value sticks; no defaultValue replay
  })
})
