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
})
