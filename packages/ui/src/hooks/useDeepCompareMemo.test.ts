import { renderHook } from "@testing-library/react"
import type { DependencyList } from "react"
import { describe, expect, it, vi } from "vitest"
import { useDeepCompareMemo } from "./useDeepCompareMemo"

describe("useDeepCompareMemo", () => {
  it("keeps the value while the dependencies are deeply equal", () => {
    const factory = vi.fn(() => ({}))
    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemo(factory, deps),
      { initialProps: { deps: [{ a: 1, b: [1, 2] }] as DependencyList } },
    )
    const first = result.current
    rerender({ deps: [{ a: 1, b: [1, 2] }] })
    rerender({ deps: [{ b: [1, 2], a: 1 }] })
    expect(result.current).toBe(first)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it("recomputes with the latest factory when a nested value changes", () => {
    const { result, rerender } = renderHook(
      ({ deps, label }) => useDeepCompareMemo(() => ({ label }), deps),
      {
        initialProps: {
          deps: [{ a: 1, b: [1, 2] }] as DependencyList,
          label: "first",
        },
      },
    )
    const first = result.current
    rerender({ deps: [{ a: 1, b: [1, 3] }], label: "second" })
    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({ label: "second" })
  })

  it("recomputes on every render when a dependency is a new function", () => {
    const factory = vi.fn(() => ({}))
    const { result, rerender } = renderHook(() =>
      useDeepCompareMemo(factory, [{ onChange: () => {} }]),
    )
    const first = result.current
    rerender()
    expect(result.current).not.toBe(first)
  })
})
