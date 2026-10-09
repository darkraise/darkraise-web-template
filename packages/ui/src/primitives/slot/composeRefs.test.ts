import { render, renderHook } from "@testing-library/react"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { composeRefs, useComposedRefs } from "./composeRefs"

describe("composeRefs", () => {
  it("invokes a single function ref", () => {
    const ref = vi.fn()
    const composed = composeRefs(ref)
    const node = document.createElement("div")
    composed(node)
    expect(ref).toHaveBeenCalledWith(node)
  })

  it("assigns to a single ref object", () => {
    const ref: { current: HTMLDivElement | null } = { current: null }
    const composed = composeRefs(ref)
    const node = document.createElement("div")
    composed(node)
    expect(ref.current).toBe(node)
  })

  it("invokes multiple refs in order", () => {
    const a = vi.fn()
    const b: { current: HTMLDivElement | null } = { current: null }
    const c = vi.fn()
    const node = document.createElement("div")
    composeRefs(a, b, c)(node)
    expect(a).toHaveBeenCalledWith(node)
    expect(b.current).toBe(node)
    expect(c).toHaveBeenCalledWith(node)
  })

  it("ignores null and undefined entries", () => {
    const ref = vi.fn()
    const composed = composeRefs(ref, null, undefined)
    composed(document.createElement("div"))
    expect(ref).toHaveBeenCalledTimes(1)
  })

  it("clears refs on unmount-style null call", () => {
    const a = vi.fn()
    const b: { current: HTMLDivElement | null } = {
      current: document.createElement("div"),
    }
    composeRefs(a, b)(null)
    expect(a).toHaveBeenCalledWith(null)
    expect(b.current).toBe(null)
  })
})

describe("useComposedRefs", () => {
  it("keeps its identity while every ref keeps its identity", () => {
    const a = vi.fn()
    const b: { current: HTMLDivElement | null } = { current: null }
    const { result, rerender } = renderHook(() =>
      useComposedRefs<HTMLDivElement>(a, b),
    )
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it("returns a new callback when a ref changes", () => {
    const b: { current: HTMLDivElement | null } = { current: null }
    const { result, rerender } = renderHook(
      ({ a }: { a: (node: HTMLDivElement | null) => void }) =>
        useComposedRefs<HTMLDivElement>(a, b),
      { initialProps: { a: vi.fn() } },
    )
    const first = result.current
    const next = vi.fn()
    rerender({ a: next })
    expect(result.current).not.toBe(first)
    const node = document.createElement("div")
    result.current(node)
    expect(next).toHaveBeenCalledWith(node)
    expect(b.current).toBe(node)
  })

  it("moves the node to a ref that changes between renders and detaches the old one", () => {
    function Probe({
      extra,
      local,
    }: {
      extra: React.Ref<HTMLDivElement>
      local: React.RefObject<HTMLDivElement | null>
    }) {
      return React.createElement("div", {
        ref: useComposedRefs<HTMLDivElement>(local, extra),
        "data-testid": "probe",
      })
    }

    const local: React.RefObject<HTMLDivElement | null> = { current: null }
    const firstCallback = vi.fn()
    const { rerender, getByTestId } = render(
      React.createElement(Probe, { extra: firstCallback, local }),
    )
    const node = getByTestId("probe")
    expect(firstCallback).toHaveBeenLastCalledWith(node)

    const secondCallback = vi.fn()
    rerender(React.createElement(Probe, { extra: secondCallback, local }))
    expect(firstCallback).toHaveBeenLastCalledWith(null)
    expect(secondCallback).toHaveBeenLastCalledWith(node)
    expect(local.current).toBe(node)

    const objectRef: React.RefObject<HTMLDivElement | null> = { current: null }
    rerender(React.createElement(Probe, { extra: objectRef, local }))
    expect(secondCallback).toHaveBeenLastCalledWith(null)
    expect(objectRef.current).toBe(node)
    expect(local.current).toBe(node)
  })

  it("accepts a callback ref recreated on every render", () => {
    const seen: Array<HTMLDivElement | null> = []
    function Probe({ count }: { count: number }) {
      return React.createElement("div", {
        ref: useComposedRefs<HTMLDivElement>((node) => {
          seen.push(node)
        }),
        "data-count": count,
      })
    }

    const { rerender, container } = render(
      React.createElement(Probe, { count: 1 }),
    )
    rerender(React.createElement(Probe, { count: 2 }))
    rerender(React.createElement(Probe, { count: 3 }))
    const node = container.firstElementChild
    expect(seen).toEqual([node, null, node, null, node])
  })
})
