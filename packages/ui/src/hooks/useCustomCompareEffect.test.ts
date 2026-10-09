import { renderHook } from "@testing-library/react"
import type { DependencyList } from "react"
import { useLayoutEffect } from "react"
import { describe, expect, it, vi } from "vitest"
import { useCustomCompareEffect } from "./useCustomCompareEffect"
import { useDeepCompareEffect } from "./useDeepCompareEffect"

const withinTen = (prev: readonly number[], next: readonly number[]) =>
  Math.abs((prev[0] ?? 0) - (next[0] ?? 0)) < 10

describe("useCustomCompareEffect", () => {
  it("runs on mount and skips renders whose dependencies compare equal", () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ n }) => useCustomCompareEffect(effect, [n], withinTen),
      { initialProps: { n: 1 } },
    )
    rerender({ n: 5 })
    rerender({ n: 9 })
    expect(effect).toHaveBeenCalledTimes(1)
  })

  it("runs again, cleaning up first, when the comparator reports a change", () => {
    const calls: string[] = []
    const { rerender } = renderHook(
      ({ n }) =>
        useCustomCompareEffect(
          () => {
            calls.push(`run ${n}`)
            return () => {
              calls.push(`clean ${n}`)
            }
          },
          [n],
          withinTen,
        ),
      { initialProps: { n: 1 } },
    )
    rerender({ n: 20 })
    rerender({ n: 25 })
    expect(calls).toEqual(["run 1", "clean 1", "run 20"])
  })

  it("compares later dependencies with the ones that caused the last run", () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ n }) => useCustomCompareEffect(effect, [n], withinTen),
      { initialProps: { n: 1 } },
    )
    rerender({ n: 8 })
    rerender({ n: 15 })
    expect(effect).toHaveBeenCalledTimes(2)
    rerender({ n: 22 })
    expect(effect).toHaveBeenCalledTimes(2)
  })

  it("runs whenever React sees a change if the comparator never reports equal", () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ n }) => useCustomCompareEffect(effect, [n], () => false),
      { initialProps: { n: 1 } },
    )
    rerender({ n: 1 })
    expect(effect).toHaveBeenCalledTimes(1)
    rerender({ n: 2 })
    rerender({ n: 3 })
    expect(effect).toHaveBeenCalledTimes(3)
  })

  it("passes the dependencies to the given effect hook", () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ n }) =>
        useCustomCompareEffect(effect, [n], withinTen, useLayoutEffect),
      { initialProps: { n: 1 } },
    )
    rerender({ n: 5 })
    expect(effect).toHaveBeenCalledTimes(1)
    rerender({ n: 50 })
    expect(effect).toHaveBeenCalledTimes(2)
  })
})

describe("useDeepCompareEffect", () => {
  it("runs only when the dependencies stop being deeply equal", () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ deps }) => useDeepCompareEffect(effect, deps),
      { initialProps: { deps: [{ a: [1] }] as DependencyList } },
    )
    rerender({ deps: [{ a: [1] }] })
    expect(effect).toHaveBeenCalledTimes(1)
    rerender({ deps: [{ a: [2] }] })
    expect(effect).toHaveBeenCalledTimes(2)
  })
})
