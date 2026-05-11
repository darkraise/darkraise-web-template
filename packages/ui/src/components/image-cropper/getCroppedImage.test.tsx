import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useImageCropper } from "./useImageCropper"

interface CanvasProto {
  getContext: HTMLCanvasElement["getContext"]
  toBlob: HTMLCanvasElement["toBlob"]
  toDataURL: HTMLCanvasElement["toDataURL"]
}

let drawCalls: Array<{ args: unknown[] }> = []
let clipCalls = 0
let stubCtx: Partial<CanvasRenderingContext2D> & { filter?: string } = {}
let savedGetContext: CanvasProto["getContext"] | undefined
let savedToBlob: CanvasProto["toBlob"] | undefined
let savedToDataURL: CanvasProto["toDataURL"] | undefined

beforeAll(() => {
  const proto = HTMLCanvasElement.prototype as unknown as CanvasProto
  savedGetContext = proto.getContext
  savedToBlob = proto.toBlob
  savedToDataURL = proto.toDataURL

  stubCtx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    clip: vi.fn(() => {
      clipCalls += 1
    }),
    drawImage: vi.fn((...args: unknown[]) => {
      drawCalls.push({ args })
    }),
    filter: "none",
  }
  proto.getContext = vi.fn((id: string) =>
    id === "2d" ? (stubCtx as CanvasRenderingContext2D) : null,
  ) as HTMLCanvasElement["getContext"]
  proto.toBlob = vi.fn((cb: BlobCallback) => {
    cb(new Blob(["x"], { type: "image/png" }))
  }) as HTMLCanvasElement["toBlob"]
  proto.toDataURL = vi.fn(
    () => "data:image/png;base64,STUB",
  ) as HTMLCanvasElement["toDataURL"]
})

afterAll(() => {
  const proto = HTMLCanvasElement.prototype as unknown as CanvasProto
  if (savedGetContext) proto.getContext = savedGetContext
  if (savedToBlob) proto.toBlob = savedToBlob
  if (savedToDataURL) proto.toDataURL = savedToDataURL
})

function attachImageStub(
  ref: React.MutableRefObject<HTMLImageElement | null>,
  natural = { naturalWidth: 1024, naturalHeight: 768 },
) {
  const img = document.createElement("img")
  Object.defineProperty(img, "naturalWidth", {
    configurable: true,
    value: natural.naturalWidth,
  })
  Object.defineProperty(img, "naturalHeight", {
    configurable: true,
    value: natural.naturalHeight,
  })
  ref.current = img
  return { img, natural }
}

describe("useImageCropper.getCroppedImage", () => {
  it("returns null when the image hasn't loaded", async () => {
    const { result } = renderHook(() => useImageCropper())
    await act(async () => {
      const out = await result.current.getCroppedImage()
      expect(out).toBeNull()
    })
  })

  it("returns null when the viewport hasn't been measured", async () => {
    const { result } = renderHook(() => useImageCropper())
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 600,
      }),
    )
    await act(async () => {
      const out = await result.current.getCroppedImage()
      expect(out).toBeNull()
    })
  })

  it("returns a Blob by default", async () => {
    drawCalls = []
    clipCalls = 0
    const { result } = renderHook(() => useImageCropper())
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 600,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 50, y: 50, width: 200, height: 150 }))
    let result1: Blob | string | null = null
    await act(async () => {
      result1 = await result.current.getCroppedImage()
    })
    expect(result1).toBeInstanceOf(Blob)
    // stage drawImage + final drawImage = 2 invocations.
    expect(drawCalls.length).toBe(2)
    // Final drawImage receives the source crop coords as args 1..4 (after
    // the source canvas) and the destination 0,0,outW,outH as args 5..8.
    const finalArgs = drawCalls[1]?.args ?? []
    expect(finalArgs[1]).toBe(50)
    expect(finalArgs[2]).toBe(50)
    expect(finalArgs[3]).toBe(200)
    expect(finalArgs[4]).toBe(150)
    expect(finalArgs[5]).toBe(0)
    expect(finalArgs[6]).toBe(0)
    expect(finalArgs[7]).toBe(200)
    expect(finalArgs[8]).toBe(150)
  })

  it("returns a data URL string when output='dataUrl'", async () => {
    const { result } = renderHook(() => useImageCropper())
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 600,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 0, y: 0, width: 100, height: 100 }))
    let result1: Blob | string | null = null
    await act(async () => {
      result1 = await result.current.getCroppedImage({ output: "dataUrl" })
    })
    expect(typeof result1).toBe("string")
    expect(result1).toMatch(/^data:image\/png/)
  })

  it("clips the destination canvas with an arc when cropShape='circle'", async () => {
    clipCalls = 0
    const { result } = renderHook(() =>
      useImageCropper({ cropShape: "circle" }),
    )
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 800,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 400 }))
    act(() => result.current.setCrop({ x: 50, y: 50, width: 200, height: 200 }))
    await act(async () => {
      await result.current.getCroppedImage()
    })
    expect(clipCalls).toBe(1)
  })

  it("applies the filter option to the staging canvas", async () => {
    stubCtx.filter = "none"
    const { result } = renderHook(() => useImageCropper())
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 600,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 0, y: 0, width: 200, height: 150 }))
    await act(async () => {
      await result.current.getCroppedImage({
        filter: "brightness(1.2) saturate(1.5)",
      })
    })
    expect(stubCtx.filter).toBe("brightness(1.2) saturate(1.5)")
  })

  it("honors the user-supplied output width/height", async () => {
    drawCalls = []
    const { result } = renderHook(() => useImageCropper())
    attachImageStub(
      result.current
        .imageRef as React.MutableRefObject<HTMLImageElement | null>,
    )
    act(() =>
      result.current.registerImage({
        naturalWidth: 800,
        naturalHeight: 600,
      }),
    )
    act(() => result.current.registerViewport({ width: 400, height: 300 }))
    act(() => result.current.setCrop({ x: 0, y: 0, width: 200, height: 150 }))
    await act(async () => {
      await result.current.getCroppedImage({ width: 64, height: 48 })
    })
    const finalArgs = drawCalls[1]?.args ?? []
    expect(finalArgs[7]).toBe(64)
    expect(finalArgs[8]).toBe(48)
  })
})
