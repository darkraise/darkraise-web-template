import { describe, expect, it, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { ImageCropper, type ImageCropperHandle } from "./ImageCropper"

beforeAll(() => {
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn()
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  }
  // jsdom does not implement HTMLCanvasElement's 2D context or actually invoke
  // toBlob's callback. Stub the minimal surface the component touches so
  // exportAsBlob reaches canvas.toBlob and the spy can verify it was called.
  const proto = HTMLCanvasElement.prototype as unknown as {
    getContext: (id: string) => CanvasRenderingContext2D | null
    toBlob: (cb: BlobCallback, type?: string, quality?: number) => void
  }
  const ctxStub: Partial<CanvasRenderingContext2D> = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  }
  proto.getContext = vi.fn((id: string) =>
    id === "2d" ? (ctxStub as CanvasRenderingContext2D) : null,
  )
  proto.toBlob = vi.fn((cb: BlobCallback) => {
    cb(null)
  })
})

describe("ImageCropper", () => {
  it("renders the source image", () => {
    render(<ImageCropper src="/img.png" alt="x" />)
    expect(screen.getByAltText("x")).toHaveAttribute("src", "/img.png")
  })

  it("rotate button rotates by 90 degrees", async () => {
    const onRotationChange = vi.fn()
    render(
      <ImageCropper
        src="/img.png"
        alt="x"
        onRotationChange={onRotationChange}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /rotate/i }))
    expect(onRotationChange).toHaveBeenLastCalledWith(90)
  })

  it("zoom slider increases zoom", async () => {
    const onZoomChange = vi.fn()
    render(<ImageCropper src="/img.png" alt="x" onZoomChange={onZoomChange} />)
    const slider = screen.getByRole("slider", {
      name: /zoom/i,
    }) as HTMLInputElement
    // React tracks the input's value internally; bypass that tracker by
    // calling the native prototype setter, then dispatch the native input
    // event so React's synthetic onChange fires.
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set
    setter?.call(slider, "2")
    slider.dispatchEvent(new Event("input", { bubbles: true }))
    expect(onZoomChange).toHaveBeenLastCalledWith(2)
  })

  it("controlled zoom prop is honored", () => {
    render(
      <ImageCropper
        src="/img.png"
        alt="x"
        zoom={1.5}
        onZoomChange={() => {}}
      />,
    )
    const slider = screen.getByRole("slider", {
      name: /zoom/i,
    }) as HTMLInputElement
    expect(slider.value).toBe("1.5")
  })

  it("imperative exportAsBlob calls canvas.toBlob", async () => {
    const ref = React.createRef<ImageCropperHandle>()
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob")
    render(<ImageCropper ref={ref} src="/img.png" alt="x" />)
    await ref.current?.exportAsBlob({ width: 100, height: 100 })
    expect(toBlob).toHaveBeenCalled()
    toBlob.mockRestore()
  })
})
