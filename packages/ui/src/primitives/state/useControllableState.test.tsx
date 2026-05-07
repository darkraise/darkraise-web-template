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

  it("does not switch modes when value goes from defined to undefined mid-life", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value?: number }) =>
        useControllableState<number>({ value, defaultValue: 0 }),
      { initialProps: { value: 5 } },
    )
    expect(result.current[0]).toBe(5)
    rerender({ value: undefined })
    expect(result.current[0]).toBe(5) // last controlled value sticks; no defaultValue replay
  })
})
