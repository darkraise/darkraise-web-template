import { describe, expect, it, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import * as React from "react"
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad"

beforeAll(() => {
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn()
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  }
  // jsdom does not implement HTMLCanvasElement's 2D context, toDataURL, or
  // toBlob without the optional `canvas` npm dep. Stub the minimal surface the
  // component touches so we can verify its dirty-flag bookkeeping and forward
  // calls without pulling in a native build dependency.
  const proto = HTMLCanvasElement.prototype as unknown as {
    getContext: (id: string) => CanvasRenderingContext2D | null
    toDataURL: (type?: string, quality?: number) => string
    toBlob: (cb: BlobCallback, type?: string, quality?: number) => void
  }
  const ctxStub: Partial<CanvasRenderingContext2D> = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    setTransform: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "butt",
    lineJoin: "miter",
  }
  proto.getContext = vi.fn(() => ctxStub as CanvasRenderingContext2D)
  proto.toDataURL = vi.fn(() => "data:image/png;base64,")
  proto.toBlob = vi.fn((cb: BlobCallback) => {
    cb(null)
  })
})

describe("SignaturePad", () => {
  it("renders a canvas with the given dimensions", () => {
    render(<SignaturePad width={400} height={200} data-testid="pad" />)
    const canvas = screen.getByTestId("pad")
    expect(canvas.tagName).toBe("CANVAS")
    expect(canvas).toHaveAttribute("width", "400")
    expect(canvas).toHaveAttribute("height", "200")
  })

  it("isEmpty is true on mount", () => {
    const ref = React.createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} width={100} height={100} />)
    expect(ref.current?.isEmpty()).toBe(true)
  })

  it("clear resets isEmpty to true", () => {
    const ref = React.createRef<SignaturePadHandle>()
    render(
      <SignaturePad ref={ref} width={100} height={100} data-testid="pad" />,
    )
    const canvas = screen.getByTestId("pad")
    canvas.getBoundingClientRect = vi.fn(
      () =>
        ({
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
          toJSON: () => ({}),
        }) as DOMRect,
    )
    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 10,
        clientY: 10,
        pointerId: 1,
        bubbles: true,
      }),
    )
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 20,
        clientY: 20,
        pointerId: 1,
        bubbles: true,
      }),
    )
    canvas.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: 20,
        clientY: 20,
        pointerId: 1,
        bubbles: true,
      }),
    )
    expect(ref.current?.isEmpty()).toBe(false)
    ref.current?.clear()
    expect(ref.current?.isEmpty()).toBe(true)
  })

  it("toDataURL returns a string starting with data:image/png", () => {
    const ref = React.createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} width={100} height={100} />)
    expect(ref.current?.toDataURL()).toMatch(/^data:image\/png/)
  })

  it("toBlob calls the callback with a Blob (or null in jsdom)", async () => {
    const ref = React.createRef<SignaturePadHandle>()
    render(<SignaturePad ref={ref} width={100} height={100} />)
    const blob = await new Promise<Blob | null>((resolve) =>
      ref.current?.toBlob(resolve),
    )
    expect(blob === null || blob instanceof Blob).toBe(true)
  })
})
