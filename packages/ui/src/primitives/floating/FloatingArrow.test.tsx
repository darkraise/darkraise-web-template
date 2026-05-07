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
})
