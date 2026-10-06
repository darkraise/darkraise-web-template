import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import { UiLabelsProvider } from "../../labels"
import { QrCode, QrCodeFrame, QrCodeOverlay } from "./QrCode"
import { encodeQr } from "./qrEncoder"

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

  it("pads the code with a four-module quiet zone by default", () => {
    const { container, rerender } = render(<QrCode value="quiet" />)
    const modules = encodeQr("quiet", "M").size
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      `0 0 ${modules + 8} ${modules + 8}`,
    )
    rerender(<QrCode value="quiet" margin={0} />)
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      `0 0 ${modules} ${modules}`,
    )
  })

  it("paints black modules on an opaque white ground by default", () => {
    const { container } = render(<QrCode value="ground" />)
    const [ground, modules] = container.querySelectorAll("svg path")
    expect(ground?.getAttribute("fill")).toBe("#fff")
    expect(modules?.getAttribute("fill")).toBe("#000")
  })

  it("names the code as an image", () => {
    const { rerender } = render(<QrCode value="named" />)
    expect(screen.getByRole("img", { name: "QR code" })).toBeInTheDocument()
    rerender(<QrCode value="named" label="Scan to pay" />)
    expect(screen.getByRole("img", { name: "Scan to pay" })).toBeInTheDocument()
  })

  it("takes its default name from the qrCode labels", () => {
    render(
      <UiLabelsProvider value={{ qrCode: { label: "Mã QR" } }}>
        <QrCode value="named" />
      </UiLabelsProvider>,
    )
    expect(screen.getByRole("img", { name: "Mã QR" })).toBeInTheDocument()
  })

  it("reports a value too long to encode and renders the fallback", () => {
    const onError = vi.fn()
    const value = "x".repeat(300)
    const { container, rerender } = render(
      <QrCode
        value={value}
        level="H"
        onError={onError}
        fallback={<span data-testid="fallback">Too long</span>}
      >
        <QrCodeFrame />
        <QrCodeOverlay>
          <span data-testid="logo">LOGO</span>
        </QrCodeOverlay>
      </QrCode>,
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    expect(container.querySelector(".dr-qr-code-frame")).toHaveAttribute(
      "data-state",
      "error",
    )
    expect(container.querySelector("svg")).toBeNull()
    expect(screen.getByTestId("fallback")).toBeInTheDocument()
    expect(screen.queryByTestId("logo")).toBeNull()

    rerender(
      <QrCode value={value} level="H" onError={onError}>
        <QrCodeFrame />
      </QrCode>,
    )
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("reports once under StrictMode", () => {
    const onError = vi.fn()
    render(
      <React.StrictMode>
        <QrCode value={"x".repeat(300)} level="H" onError={onError} />
      </React.StrictMode>,
    )
    expect(onError).toHaveBeenCalledTimes(1)
  })
})
