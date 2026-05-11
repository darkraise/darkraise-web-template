import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useImageCropper } from "./useImageCropper"

describe("useImageCropper", () => {
  it("returns documented defaults", () => {
    const { result } = renderHook(() => useImageCropper())
    expect(result.current.zoom).toBe(1)
    expect(result.current.rotation).toBe(0)
    expect(result.current.flip).toEqual({ horizontal: false, vertical: false })
    expect(result.current.minZoom).toBe(1)
    expect(result.current.maxZoom).toBe(5)
    expect(result.current.minWidth).toBe(40)
    expect(result.current.minHeight).toBe(40)
    expect(result.current.cropShape).toBe("rectangle")
    expect(result.current.fixedCropArea).toBe(false)
  })

  it("setZoom clamps to min/max", () => {
    const onZoomChange = vi.fn()
    const { result } = renderHook(() =>
      useImageCropper({ minZoom: 1, maxZoom: 3, onZoomChange }),
    )
    act(() => result.current.setZoom(10))
    expect(result.current.zoom).toBe(3)
    expect(onZoomChange).toHaveBeenLastCalledWith({ zoom: 3 })
    act(() => result.current.setZoom(-1))
    expect(result.current.zoom).toBe(1)
  })

  it("setRotation wraps into [0, 360)", () => {
    const onRotationChange = vi.fn()
    const { result } = renderHook(() => useImageCropper({ onRotationChange }))
    act(() => result.current.setRotation(450))
    expect(result.current.rotation).toBe(90)
    act(() => result.current.setRotation(-30))
    expect(result.current.rotation).toBe(330)
    expect(onRotationChange).toHaveBeenLastCalledWith({ rotation: 330 })
  })

  it("rotateBy increments rotation modulo 360", () => {
    const { result } = renderHook(() =>
      useImageCropper({ defaultRotation: 270 }),
    )
    act(() => result.current.rotateBy(180))
    expect(result.current.rotation).toBe(90)
  })

  it("flipHorizontal / flipVertical toggle independently", () => {
    const onFlipChange = vi.fn()
    const { result } = renderHook(() => useImageCropper({ onFlipChange }))
    act(() => result.current.flipHorizontal())
    expect(result.current.flip).toEqual({ horizontal: true, vertical: false })
    act(() => result.current.flipVertical())
    expect(result.current.flip).toEqual({ horizontal: true, vertical: true })
    expect(onFlipChange).toHaveBeenLastCalledWith({
      flip: { horizontal: true, vertical: true },
    })
  })

  it("setCrop clamps the rect inside the registered viewport", () => {
    const onCropChange = vi.fn()
    const { result } = renderHook(() => useImageCropper({ onCropChange }))
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() =>
      result.current.setCrop({ x: -50, y: 500, width: 600, height: 600 }),
    )
    const { x, y, width, height } = result.current.crop
    expect(x).toBeGreaterThanOrEqual(0)
    expect(y).toBeGreaterThanOrEqual(0)
    expect(x + width).toBeLessThanOrEqual(400)
    expect(y + height).toBeLessThanOrEqual(300)
    expect(onCropChange).toHaveBeenCalled()
  })

  it("setCrop honors minWidth / minHeight", () => {
    const { result } = renderHook(() =>
      useImageCropper({ minWidth: 80, minHeight: 80 }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 0, y: 0, width: 10, height: 10 }))
    expect(result.current.crop.width).toBe(80)
    expect(result.current.crop.height).toBe(80)
  })

  it("setCrop enforces aspectRatio", () => {
    const { result } = renderHook(() => useImageCropper({ aspectRatio: 2 }))
    act(() => result.current.registerViewport({ width: 800, height: 600 }))
    act(() => result.current.setCrop({ x: 0, y: 0, width: 200, height: 200 }))
    expect(result.current.crop.width / result.current.crop.height).toBeCloseTo(
      2,
      5,
    )
  })

  it("setCrop is a no-op when fixedCropArea is true", () => {
    const { result } = renderHook(() =>
      useImageCropper({
        fixedCropArea: true,
        defaultCrop: { x: 10, y: 10, width: 100, height: 100 },
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 200, y: 200, width: 50, height: 50 }))
    expect(result.current.crop).toEqual({
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    })
  })

  it("seeds a centered 80% crop when no value is provided", () => {
    const { result } = renderHook(() => useImageCropper())
    act(() => result.current.registerViewport({ width: 400, height: 200 }))
    expect(result.current.crop.width).toBeCloseTo(320, 5)
    expect(result.current.crop.height).toBeCloseTo(160, 5)
    expect(result.current.crop.x).toBeCloseTo(40, 5)
    expect(result.current.crop.y).toBeCloseTo(20, 5)
  })

  it("does not seed when defaultCrop or initialCrop is supplied", () => {
    const initial = { x: 5, y: 5, width: 50, height: 50 }
    const { result } = renderHook(() =>
      useImageCropper({ initialCrop: initial }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    expect(result.current.crop).toEqual(initial)
  })

  it("controlled zoom is honored and onZoomChange fires with clamped value", () => {
    const onZoomChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ zoom }) => useImageCropper({ zoom, maxZoom: 4, onZoomChange }),
      { initialProps: { zoom: 2 } },
    )
    expect(result.current.zoom).toBe(2)
    act(() => result.current.setZoom(99))
    // Clamped value flows through onChange even though controlled state owns
    // the externally supplied value.
    expect(onZoomChange).toHaveBeenLastCalledWith({ zoom: 4 })
    rerender({ zoom: 1.5 })
    expect(result.current.zoom).toBe(1.5)
  })

  it("registerImage updates the image natural size", () => {
    const { result } = renderHook(() => useImageCropper())
    act(() =>
      result.current.registerImage({
        naturalWidth: 1024,
        naturalHeight: 768,
      }),
    )
    expect(result.current.image).toEqual({
      naturalWidth: 1024,
      naturalHeight: 768,
    })
    expect(result.current.imageReady).toBe(true)
  })

  it("merges supplied translations with English defaults", () => {
    const { result } = renderHook(() =>
      useImageCropper({
        translations: { selectionLabel: "Selección" },
      }),
    )
    expect(result.current.translations.selectionLabel).toBe("Selección")
    // Untouched keys keep their English defaults so partial translations
    // don't accidentally erase ARIA labels.
    expect(result.current.translations.handleLabel("top-left")).toBe(
      "Resize top-left",
    )
  })

  it("setDragging toggles isDragging flag", () => {
    const { result } = renderHook(() => useImageCropper())
    expect(result.current.isDragging).toBe(false)
    act(() => result.current.setDragging(true))
    expect(result.current.isDragging).toBe(true)
    act(() => result.current.setDragging(false))
    expect(result.current.isDragging).toBe(false)
  })

  it("getDisplayedImageBounds returns the contain-fitted rect at zoom 1", () => {
    const { result } = renderHook(() => useImageCropper())
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 400,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 400 }))
    const bounds = result.current.getDisplayedImageBounds()
    // 2:1 image inside a 400×400 viewport — width fills, height halves.
    expect(bounds.width).toBeCloseTo(400, 5)
    expect(bounds.height).toBeCloseTo(200, 5)
    expect(bounds.x).toBeCloseTo(0, 5)
    expect(bounds.y).toBeCloseTo(100, 5)
  })

  it("constrainToImage clamps the selection to the displayed image", () => {
    const { result } = renderHook(() =>
      useImageCropper({ constrainToImage: true }),
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 400,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 400 }))
    // Image bounds are y=100..300 (height 200, centered in 400). Forcing y=20
    // (above the image) should clamp into the image rect, not the viewport.
    act(() => result.current.setCrop({ x: 0, y: 20, width: 200, height: 100 }))
    expect(result.current.crop.y).toBeGreaterThanOrEqual(100)
    expect(
      result.current.crop.y + result.current.crop.height,
    ).toBeLessThanOrEqual(300)
  })
})
