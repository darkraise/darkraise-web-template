import { afterEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { Marquee } from "./Marquee"

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** jsdom lays nothing out, so widths come from the class each box carries. */
function stubLayout(container: number, copy: number, gap: number) {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const width = this.classList.contains("dr-marquee")
        ? container
        : this.classList.contains("dr-marquee-group")
          ? copy
          : 0
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 20,
        width,
        height: 20,
      } as DOMRect
    },
  )
  const realStyle = window.getComputedStyle.bind(window)
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) =>
    element.classList.contains("dr-marquee-track")
      ? ({ columnGap: `${gap}px` } as CSSStyleDeclaration)
      : realStyle(element, pseudo),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  FakeResizeObserver.instances = []
})

describe("Marquee", () => {
  it("renders two copies, the second hidden, before it is measured", () => {
    render(
      <Marquee data-testid="m">
        <span>Hello</span>
      </Marquee>,
    )
    const groups = screen.getByTestId("m").querySelectorAll(".dr-marquee-group")
    expect(groups).toHaveLength(2)
    expect(groups[0]).not.toHaveAttribute("aria-hidden")
    expect(groups[1]).toHaveAttribute("aria-hidden", "true")
    expect(
      screen.getByTestId("m").style.getPropertyValue("--marquee-step"),
    ).toBe("")
  })

  it.each([
    [1102, 784, 32, 3],
    [300, 784, 32, 2],
    [2000, 184, 16, 11],
  ])(
    "covers a %ipx container with %ipx copies %ipx apart in %i copies",
    (container, copy, gap, copies) => {
      stubLayout(container, copy, gap)
      render(
        <Marquee data-testid="m">
          <span>Hello</span>
        </Marquee>,
      )
      act(() => {
        for (const observer of FakeResizeObserver.instances) {
          observer.callback([], observer as unknown as ResizeObserver)
        }
      })
      const root = screen.getByTestId("m")
      const groups = root.querySelectorAll(".dr-marquee-group")
      expect(groups).toHaveLength(copies)
      expect(groups[0]).not.toHaveAttribute("aria-hidden")
      for (const group of [...groups].slice(1)) {
        expect(group).toHaveAttribute("aria-hidden", "true")
      }
      expect(screen.getAllByText("Hello")).toHaveLength(copies)
      expect(root.style.getPropertyValue("--marquee-step")).toBe(
        `${copy + gap}px`,
      )
    },
  )

  it("applies pauseOnHover via data attribute", () => {
    render(
      <Marquee pauseOnHover data-testid="m">
        <span>x</span>
      </Marquee>,
    )
    expect(screen.getByTestId("m")).toHaveAttribute(
      "data-pause-on-hover",
      "true",
    )
  })
})
