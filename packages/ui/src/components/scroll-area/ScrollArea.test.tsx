import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, it, expect, vi } from "vitest"
import {
  ScrollArea,
  ScrollAreaViewport,
  ScrollBar,
} from "@components/scroll-area"

describe("ScrollArea", () => {
  it("renders the viewport with overflow-auto and exposes the data marker", () => {
    render(
      <ScrollArea data-testid="root">
        <p>some content</p>
      </ScrollArea>,
    )
    const root = screen.getByTestId("root")
    const viewport = root.querySelector("[data-darkraise-scroll-viewport]")
    expect(viewport).toBeTruthy()
    expect(viewport?.className).toMatch(/overflow-auto/)
  })

  it("does not emit a display:table wrapper inside the viewport", () => {
    render(
      <ScrollArea data-testid="root">
        <span>only-child</span>
      </ScrollArea>,
    )
    const viewport = screen
      .getByTestId("root")
      .querySelector("[data-darkraise-scroll-viewport]")
    // First child should be the user-supplied <span>, not a generated div.
    const child = viewport?.firstElementChild
    expect(child?.tagName).toBe("SPAN")
    const inlineStyle = child?.getAttribute("style") ?? ""
    expect(inlineStyle).not.toMatch(/display: ?table/)
  })

  it("ScrollAreaViewport works as a standalone composable", () => {
    render(
      <ScrollArea data-testid="root">
        <ScrollAreaViewport data-testid="vp">
          <span>hello</span>
        </ScrollAreaViewport>
      </ScrollArea>,
    )
    // The implicit and explicit viewports both render — we should still find one with the marker.
    const viewports = screen
      .getByTestId("root")
      .querySelectorAll("[data-darkraise-scroll-viewport]")
    expect(viewports.length).toBeGreaterThanOrEqual(1)
  })

  it("hides the ScrollBar when content fits", () => {
    render(
      <ScrollArea data-testid="root">
        <p>tiny</p>
      </ScrollArea>,
    )
    // jsdom reports scrollHeight == clientHeight for empty layouts, so the
    // bar should not render (ratio == 1).
    const root = screen.getByTestId("root")
    const bar = root.querySelector(".dr-scroll-bar")
    expect(bar).toBeNull()
  })

  it("ScrollBar can be rendered explicitly", () => {
    render(
      <ScrollArea data-testid="root">
        <ScrollBar orientation="horizontal" />
        <p>x</p>
      </ScrollArea>,
    )
    // Explicit ScrollBar still gates on metrics; verify the data marker
    // doesn't crash the render.
    expect(screen.getByTestId("root")).toBeInTheDocument()
  })

  it("writes dir to the root only when it is given", () => {
    const { rerender } = render(
      <ScrollArea data-testid="root">
        <p>x</p>
      </ScrollArea>,
    )
    expect(screen.getByTestId("root")).not.toHaveAttribute("dir")
    rerender(
      <ScrollArea data-testid="root" dir="rtl">
        <p>x</p>
      </ScrollArea>,
    )
    expect(screen.getByTestId("root")).toHaveAttribute("dir", "rtl")
  })
})

describe("ScrollArea type", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  /** jsdom lays nothing out; make every element 100px tall over 400px of
   *  content so the vertical axis overflows. */
  function overflow() {
    vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(100)
    vi.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(400)
  }

  function bar() {
    return screen.getByTestId("root").querySelector(".dr-scroll-bar")
  }

  function viewport() {
    return screen
      .getByTestId("root")
      .querySelector("[data-darkraise-scroll-viewport]") as HTMLElement
  }

  it("shows the bar under always even when nothing overflows", () => {
    render(
      <ScrollArea data-testid="root" type="always">
        <p>tiny</p>
      </ScrollArea>,
    )
    expect(bar()).toHaveAttribute("data-state", "visible")
  })

  it("shows an overflowing bar under auto", () => {
    overflow()
    render(
      <ScrollArea data-testid="root">
        <p>tall</p>
      </ScrollArea>,
    )
    expect(bar()).toHaveAttribute("data-state", "visible")
  })

  it("shows the bar under scroll only while scrolling, then hides it after the delay", () => {
    vi.useFakeTimers()
    overflow()
    render(
      <ScrollArea data-testid="root" type="scroll" scrollHideDelay={300}>
        <p>tall</p>
      </ScrollArea>,
    )
    expect(bar()).toHaveAttribute("data-state", "hidden")
    fireEvent.scroll(viewport())
    expect(bar()).toHaveAttribute("data-state", "visible")
    act(() => vi.advanceTimersByTime(299))
    expect(bar()).toHaveAttribute("data-state", "visible")
    act(() => vi.advanceTimersByTime(1))
    expect(bar()).toHaveAttribute("data-state", "hidden")
  })

  it("shows the bar under hover while the pointer is over the area", () => {
    vi.useFakeTimers()
    overflow()
    render(
      <ScrollArea data-testid="root" type="hover">
        <p>tall</p>
      </ScrollArea>,
    )
    expect(bar()).toHaveAttribute("data-state", "hidden")
    fireEvent.pointerEnter(screen.getByTestId("root"))
    expect(bar()).toHaveAttribute("data-state", "visible")
    fireEvent.scroll(viewport())
    act(() => vi.advanceTimersByTime(1000))
    expect(bar()).toHaveAttribute("data-state", "visible")
    fireEvent.pointerLeave(screen.getByTestId("root"))
    act(() => vi.advanceTimersByTime(599))
    expect(bar()).toHaveAttribute("data-state", "visible")
    act(() => vi.advanceTimersByTime(1))
    expect(bar()).toHaveAttribute("data-state", "hidden")
  })

  it("keeps type and scrollHideDelay off the DOM", () => {
    render(
      <ScrollArea data-testid="root" type="scroll" scrollHideDelay={200}>
        <p>x</p>
      </ScrollArea>,
    )
    const root = screen.getByTestId("root")
    expect(root).not.toHaveAttribute("type")
    expect(root).not.toHaveAttribute("scrollhidedelay")
    expect(root).not.toHaveAttribute("scrollHideDelay")
  })
})
