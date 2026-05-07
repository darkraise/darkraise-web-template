import { renderHook, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { useVirtualizer } from "./useVirtualizer"

function makeScrollElement({
  clientHeight,
  scrollTop = 0,
}: {
  clientHeight: number
  scrollTop?: number
}) {
  const el = document.createElement("div")
  Object.defineProperty(el, "clientHeight", {
    value: clientHeight,
    configurable: true,
  })
  Object.defineProperty(el, "scrollHeight", {
    value: 0,
    configurable: true,
    writable: true,
  })
  el.scrollTop = scrollTop
  document.body.append(el)
  return el
}

describe("useVirtualizer", () => {
  it("emits the visible window plus overscan", () => {
    const el = makeScrollElement({ clientHeight: 100 })
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 100,
        itemHeight: 20,
        getScrollElement: () => el,
        overscan: 2,
      }),
    )
    // viewport [0..100]: 5 items visible (0..4), +2 overscan each side, but
    // before is 0. So first index 0, last 4+2=6.
    const items = result.current.virtualItems
    expect(items[0]?.index).toBe(0)
    expect(items[items.length - 1]?.index).toBe(7)
    expect(result.current.totalSize).toBe(2000)
    el.remove()
  })

  it("expands on scroll", () => {
    const el = makeScrollElement({ clientHeight: 100, scrollTop: 200 })
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 100,
        itemHeight: 20,
        getScrollElement: () => el,
        overscan: 2,
      }),
    )
    const items = result.current.virtualItems
    // scrollTop 200 / 20 = 10 → range 10..15 visible, with 2 overscan = 8..17
    expect(items[0]?.index).toBe(8)
    expect(items[items.length - 1]?.index).toBe(17)
    el.remove()
  })

  it("recomputes on scroll event", () => {
    const el = makeScrollElement({ clientHeight: 100 })
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 100,
        itemHeight: 20,
        getScrollElement: () => el,
        overscan: 0,
      }),
    )
    const initialFirst = result.current.virtualItems[0]?.index
    expect(initialFirst).toBe(0)
    act(() => {
      el.scrollTop = 100
      el.dispatchEvent(new Event("scroll"))
    })
    const after = result.current.virtualItems[0]?.index
    expect(after).toBe(5)
    el.remove()
  })

  it("returns no items when count is zero", () => {
    const el = makeScrollElement({ clientHeight: 100 })
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 0,
        itemHeight: 20,
        getScrollElement: () => el,
      }),
    )
    expect(result.current.virtualItems).toHaveLength(0)
    expect(result.current.totalSize).toBe(0)
    el.remove()
  })

  it("scrollToIndex aligns to nearest edge", () => {
    const el = makeScrollElement({ clientHeight: 100, scrollTop: 0 })
    const { result } = renderHook(() =>
      useVirtualizer({
        count: 100,
        itemHeight: 20,
        getScrollElement: () => el,
      }),
    )
    act(() => {
      result.current.scrollToIndex(50)
    })
    // index 50 -> top=1000, bottom=1020. Current scroll 0 means the item is
    // off-screen below; auto-align scrolls so the item bottom hits the
    // viewport bottom: scrollTop = 1020 - clientHeight(100) = 920.
    expect(el.scrollTop).toBe(920)
    el.remove()
  })
})
