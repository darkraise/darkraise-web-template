import { useRef } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useScrollEdges } from "./useScrollEdges"

let dims = { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 }
let resize: (() => void) | undefined
let observed: Element[] = []

function Harness({ rtl = false, enabled = true }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollEdges(ref, enabled)
  return (
    <div
      ref={ref}
      data-testid="scroller"
      style={{ direction: rtl ? "rtl" : "ltr" }}
    >
      <table data-testid="content" />
    </div>
  )
}

function NestedHarness() {
  const ref = useRef<HTMLDivElement>(null)
  useScrollEdges(ref)
  return (
    <div ref={ref} data-testid="scroller">
      <div data-testid="wrapper">
        <table data-testid="nested" />
      </div>
    </div>
  )
}

const scroller = () => screen.getByTestId("scroller")

beforeEach(() => {
  dims = { scrollWidth: 600, clientWidth: 300, scrollLeft: 0 }
  observed = []
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(
    () => dims.scrollWidth,
  )
  vi.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(
    () => dims.clientWidth,
  )
  vi.spyOn(Element.prototype, "scrollLeft", "get").mockImplementation(
    () => dims.scrollLeft,
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe(target: Element) {
        observed.push(target)
      }
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resize = undefined
})

describe("useScrollEdges", () => {
  it("flags only the end edge at the start position", () => {
    render(<Harness />)
    expect(scroller()).toHaveAttribute("data-overflow-end", "")
    expect(scroller()).not.toHaveAttribute("data-overflow-start")
  })

  it("swaps the flags once scrolled to the end", () => {
    render(<Harness />)
    dims.scrollLeft = 300
    fireEvent.scroll(scroller())
    expect(scroller()).toHaveAttribute("data-overflow-start", "")
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
  })

  it("flags both edges mid-scroll", () => {
    render(<Harness />)
    dims.scrollLeft = 150
    fireEvent.scroll(scroller())
    expect(scroller()).toHaveAttribute("data-overflow-start", "")
    expect(scroller()).toHaveAttribute("data-overflow-end", "")
  })

  it("ignores a sub-pixel remainder", () => {
    dims.scrollWidth = 301
    render(<Harness />)
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
    expect(scroller()).not.toHaveAttribute("data-overflow-start")
  })

  it("re-measures when the scroller or its content resizes", () => {
    dims.scrollWidth = 300
    render(<Harness />)
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
    expect(observed).toEqual([scroller(), screen.getByTestId("content")])
    dims.scrollWidth = 600
    act(() => resize?.())
    expect(scroller()).toHaveAttribute("data-overflow-end", "")
  })

  it("observes a nested table rather than its full-width wrapper", () => {
    render(<NestedHarness />)
    expect(observed).toEqual([scroller(), screen.getByTestId("nested")])
  })

  it("reads a negative scrollLeft from the start edge under RTL", () => {
    render(<Harness rtl />)
    dims.scrollLeft = -300
    fireEvent.scroll(scroller())
    expect(scroller()).toHaveAttribute("data-overflow-start", "")
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
  })

  it("reads the direction once per mount and resize, not per scroll", () => {
    const spy = vi.spyOn(window, "getComputedStyle")
    render(<Harness rtl />)
    const afterMount = spy.mock.calls.length
    for (const left of [-50, -100, -150]) {
      dims.scrollLeft = left
      fireEvent.scroll(scroller())
    }
    expect(spy.mock.calls.length).toBe(afterMount)
    act(() => resize?.())
    expect(spy.mock.calls.length).toBe(afterMount + 1)
  })

  it("sets nothing while disabled", () => {
    render(<Harness enabled={false} />)
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
    expect(scroller()).not.toHaveAttribute("data-overflow-start")
  })

  it("removes its flags on unmount of the hook", () => {
    const { rerender } = render(<Harness />)
    expect(scroller()).toHaveAttribute("data-overflow-end", "")
    rerender(<Harness enabled={false} />)
    expect(scroller()).not.toHaveAttribute("data-overflow-end")
  })
})
