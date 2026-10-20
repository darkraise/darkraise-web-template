import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import {
  ImageCropper,
  ImageCropperHandle,
  ImageCropperSelection,
  ImageCropperViewport,
} from "./ImageCropper"
import { imageCropperHandles, type CropRect } from "./types"
import type { UseImageCropperOptions } from "./useImageCropper"

const START: CropRect = { x: 100, y: 100, width: 100, height: 100 }

function renderCropper(options: UseImageCropperOptions = {}) {
  const onCropChange = vi.fn()
  render(
    <ImageCropper defaultCrop={START} onCropChange={onCropChange} {...options}>
      <ImageCropperViewport>
        <ImageCropperSelection>
          {imageCropperHandles.map((position) => (
            <ImageCropperHandle key={position} position={position} />
          ))}
        </ImageCropperSelection>
      </ImageCropperViewport>
    </ImageCropper>,
  )
  const lastCrop = (): CropRect | undefined => {
    const calls = onCropChange.mock.calls
    return calls[calls.length - 1]?.[0].crop
  }
  return { onCropChange, lastCrop }
}

describe("ImageCropperHandle keyboard resize", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      width: 400,
      height: 300,
      toJSON: () => ({}),
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders each handle as a focusable named button", () => {
    renderCropper()
    expect(screen.queryAllByRole("slider")).toHaveLength(0)
    for (const position of imageCropperHandles) {
      const handle = screen.getByRole("button", { name: `Resize ${position}` })
      expect(handle.tabIndex).toBe(0)
    }
  })

  it.each([
    ["right", "ArrowRight", false, { x: 100, y: 100, width: 101, height: 100 }],
    ["left", "ArrowLeft", false, { x: 99, y: 100, width: 101, height: 100 }],
    ["bottom", "ArrowUp", true, { x: 100, y: 100, width: 100, height: 90 }],
    ["top", "ArrowUp", true, { x: 100, y: 90, width: 100, height: 110 }],
    [
      "bottom-right",
      "ArrowDown",
      true,
      { x: 100, y: 100, width: 100, height: 110 },
    ],
    [
      "top-left",
      "ArrowLeft",
      false,
      { x: 99, y: 100, width: 101, height: 100 },
    ],
  ] as const)(
    "%s handle resizes on %s (shift %s)",
    (position, key, shiftKey, expected) => {
      const { lastCrop } = renderCropper()
      const handle = screen.getByRole("button", { name: `Resize ${position}` })
      fireEvent.keyDown(handle, { key, shiftKey })
      expect(lastCrop()).toEqual(expected)
    },
  )

  it("ignores arrows across an edge handle's axis", () => {
    const { onCropChange } = renderCropper()
    const handle = screen.getByRole("button", { name: "Resize right" })
    fireEvent.keyDown(handle, { key: "ArrowUp" })
    expect(onCropChange).not.toHaveBeenCalled()
  })

  it("clamps the keyboard resize to maxWidth", () => {
    const { lastCrop } = renderCropper({ maxWidth: 105 })
    const handle = screen.getByRole("button", { name: "Resize right" })
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true })
    expect(lastCrop()?.width).toBe(105)
  })

  it("keeps the aspect ratio during a keyboard resize", () => {
    const { lastCrop } = renderCropper({
      aspectRatio: 2,
      defaultCrop: { x: 100, y: 100, width: 100, height: 50 },
    })
    const handle = screen.getByRole("button", { name: "Resize right" })
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true })
    expect(lastCrop()).toEqual({ x: 100, y: 97.5, width: 110, height: 55 })
  })

  it("hides the handles from assistive technology when the crop area is fixed", () => {
    renderCropper({ fixedCropArea: true })
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    const handles = screen.getAllByRole("button", { hidden: true })
    expect(handles).toHaveLength(8)
    for (const handle of handles) {
      expect(handle).toHaveAttribute("aria-hidden", "true")
    }
  })

  it("does not resize when the crop area is fixed", () => {
    const { onCropChange } = renderCropper({ fixedCropArea: true })
    const handle = screen.getByLabelText("Resize right")
    expect(handle.tabIndex).toBe(-1)
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(onCropChange).not.toHaveBeenCalled()
  })

  it("ends the resize on key release and announces the size", () => {
    renderCropper()
    const handle = screen.getByRole("button", { name: "Resize bottom-right" })
    const selection = screen.getByRole("region", { name: "Crop selection" })
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("")
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true })
    expect(selection).toHaveAttribute("data-dragging", "true")
    fireEvent.keyUp(handle, { key: "ArrowRight", shiftKey: true })
    expect(selection).not.toHaveAttribute("data-dragging")
    expect(status).toHaveTextContent("Crop size: 110 × 100")
  })
})
