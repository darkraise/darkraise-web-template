import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { QrCode, QrCodeFrame, QrCodeOverlay } from "./QrCode"

describe("QrCode", () => {
  it("renders an svg element with the given value", () => {
    const { container } = render(<QrCode value="https://example.com" />)
    const svg = container.querySelector("svg")
    expect(svg).not.toBeNull()
    const paths = container.querySelectorAll("svg path")
    expect(paths.length).toBeGreaterThan(0)
  })

  it("updates the rendered svg when value changes", () => {
    const { container, rerender } = render(<QrCode value="alpha" />)
    const before = container
      .querySelector("svg path:nth-of-type(2)")
      ?.getAttribute("d")
    rerender(<QrCode value="bravo-charlie-delta" />)
    const after = container
      .querySelector("svg path:nth-of-type(2)")
      ?.getAttribute("d")
    expect(before).toBeTruthy()
    expect(after).toBeTruthy()
    expect(after).not.toBe(before)
  })

  it("renders provided overlay children", () => {
    render(
      <QrCode value="https://example.com">
        <QrCodeFrame />
        <QrCodeOverlay>
          <span data-testid="logo">LOGO</span>
        </QrCodeOverlay>
      </QrCode>,
    )
    expect(screen.getByTestId("logo")).toBeInTheDocument()
  })

  it("changes svg viewBox when level changes from L to H", () => {
    const { container, rerender } = render(
      <QrCode value="https://example.com" level="L" />,
    )
    const lowViewBox = container.querySelector("svg")?.getAttribute("viewBox")
    rerender(<QrCode value="https://example.com" level="H" />)
    const highViewBox = container.querySelector("svg")?.getAttribute("viewBox")
    expect(lowViewBox).toBeTruthy()
    expect(highViewBox).toBeTruthy()
    expect(highViewBox).not.toBe(lowViewBox)
  })

  it("reflects the level prop on the root via data-level", () => {
    const { container } = render(<QrCode value="x" level="Q" />)
    const root = container.querySelector(".dr-qr-code")
    expect(root?.getAttribute("data-level")).toBe("Q")
  })
})
