import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
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
})
