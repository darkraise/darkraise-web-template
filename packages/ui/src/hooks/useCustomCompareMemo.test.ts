import { renderHook } from "@testing-library/react"
import type { DependencyList } from "react"
import { describe, expect, it, vi } from "vitest"
import { useCustomCompareMemo } from "./useCustomCompareMemo"

const sameLength = (prev: DependencyList, next: DependencyList) =>
  prev.length === next.length

describe("useCustomCompareMemo", () => {
  it("keeps the value while the comparator reports equal dependencies", () => {
    const factory = vi.fn(() => ({}))
    const { result, rerender } = renderHook(
      ({ deps }) => useCustomCompareMemo(factory, deps, sameLength),
      { initialProps: { deps: [1] as DependencyList } },
    )
    const first = result.current
    rerender({ deps: [2] })
    rerender({ deps: [3] })
    expect(result.current).toBe(first)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it("recomputes with the latest factory when the comparator reports a change", () => {
    const { result, rerender } = renderHook(
      ({ deps, label }) =>
        useCustomCompareMemo(() => ({ label }), deps, sameLength),
      { initialProps: { deps: [1] as DependencyList, label: "first" } },
    )
    const first = result.current
    rerender({ deps: [1, 2], label: "second" })
    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({ label: "second" })
  })

  it("compares later dependencies with the ones that caused the last change", () => {
    const factory = vi.fn(() => ({}))
    const { result, rerender } = renderHook(
      ({ deps }) => useCustomCompareMemo(factory, deps, sameLength),
      { initialProps: { deps: [1] as DependencyList } },
    )
    rerender({ deps: [1, 2] })
    const second = result.current
    rerender({ deps: [3, 4] })
    rerender({ deps: [5] })
    expect(result.current).not.toBe(second)
    const third = result.current
    rerender({ deps: [6] })
    expect(result.current).toBe(third)
    expect(factory).toHaveBeenCalledTimes(3)
  })

  it("recomputes on every render when the comparator never reports equal", () => {
    const factory = vi.fn(() => ({}))
    const { result, rerender } = renderHook(
      ({ deps }) => useCustomCompareMemo(factory, deps, () => false),
      { initialProps: { deps: [1] as DependencyList } },
    )
    const first = result.current
    rerender({ deps: [1] })
    expect(result.current).not.toBe(first)
  })
})
