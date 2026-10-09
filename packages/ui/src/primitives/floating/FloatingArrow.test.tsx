import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { FloatingArrow } from "./FloatingArrow"

describe("FloatingArrow", () => {
  it("renders an svg element with the default 8x4 size", () => {
    const { container } = render(<FloatingArrow />)
    const svg = container.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute("width")).toBe("8")
    expect(svg?.getAttribute("height")).toBe("4")
  })

  it("respects width and height props", () => {
    const { container } = render(<FloatingArrow width={12} height={6} />)
    const svg = container.querySelector("svg")
    expect(svg?.getAttribute("width")).toBe("12")
    expect(svg?.getAttribute("height")).toBe("6")
  })

  it.each([
    ["top", "8", "4", "M0,0 L4,4 L8,0 Z"],
    ["bottom", "8", "4", "M0,4 L4,0 L8,4 Z"],
    ["left", "4", "8", "M0,0 L4,4 L0,8 Z"],
    ["right", "4", "8", "M4,0 L0,4 L4,8 Z"],
  ] as const)(
    "points at the trigger of a popup on the %s side",
    (side, width, height, path) => {
      const { container } = render(<FloatingArrow side={side} />)
      const svg = container.querySelector("svg")
      expect(svg?.getAttribute("width")).toBe(width)
      expect(svg?.getAttribute("height")).toBe(height)
      expect(svg?.getAttribute("viewBox")).toBe(`0 0 ${width} ${height}`)
      expect(svg?.querySelector("path")?.getAttribute("d")).toBe(path)
    },
  )

  it.each([
    ["top", "M0,0 L4,4 L8,0"],
    ["bottom", "M0,4 L4,0 L8,4"],
    ["left", "M0,0 L4,4 L0,8"],
    ["right", "M4,0 L0,4 L4,8"],
  ] as const)(
    "strokes only the two outer edges of an arrow on the %s side",
    (side, edge) => {
      const { container } = render(<FloatingArrow side={side} />)
      const [fill, lift, outline] = container.querySelectorAll("path")
      expect(fill?.getAttribute("stroke")).toBe("none")
      expect(lift?.getAttribute("d")).toBe(`${edge} Z`)
      expect(lift?.getAttribute("stroke")).toBe("none")
      expect(lift?.getAttribute("fill")).toBe("none")
      expect(outline?.getAttribute("d")).toBe(edge)
      expect(outline?.getAttribute("fill")).toBe("none")
    },
  )

  it("leaves the fill to a class unless the consumer sets one", () => {
    const { container, rerender } = render(<FloatingArrow />)
    expect(container.querySelector("svg")?.hasAttribute("fill")).toBe(false)
    rerender(<FloatingArrow fill="red" />)
    expect(container.querySelector("svg")?.getAttribute("fill")).toBe("red")
  })
})
