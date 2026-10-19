import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { ImageDropzone } from "./ImageDropzone"

const PNG = new File([new Uint8Array([137, 80, 78, 71])], "a.png", {
  type: "image/png",
})

function choose(file: File) {
  const onFileAccept = vi.fn()
  const onFileReject = vi.fn()
  const { container } = render(
    <ImageDropzone onFileAccept={onFileAccept} onFileReject={onFileReject} />,
  )
  const input = container.querySelector("input[type=file]")
  if (!input) throw new Error("no file input")
  fireEvent.change(input, { target: { files: [file] } })
  return { onFileAccept, onFileReject }
}

const nativeDecode = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  "decode",
)

function stubImageDecode(decode: () => Promise<void>) {
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    writable: true,
    value: decode,
  })
}

function restoreImageDecode() {
  if (nativeDecode) {
    Object.defineProperty(HTMLImageElement.prototype, "decode", nativeDecode)
  } else {
    Reflect.deleteProperty(HTMLImageElement.prototype, "decode")
  }
}

describe("ImageDropzone decoding", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    restoreImageDecode()
  })

  it("accepts a file that createImageBitmap decodes", async () => {
    const close = vi.fn()
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.resolve({ close })),
    )
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() => expect(onFileAccept).toHaveBeenCalledTimes(1))
    expect(onFileAccept.mock.calls[0]?.[0]).toMatchObject({ file: PNG })
    expect(onFileAccept.mock.calls[0]?.[0].dataUrl).toMatch(/^data:image\/png/)
    expect(close).toHaveBeenCalled()
    expect(onFileReject).not.toHaveBeenCalled()
  })

  it("rejects a file that no decoder can read", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.reject(new Error("bad image"))),
    )
    stubImageDecode(() => Promise.reject(new Error("bad image")))
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() =>
      expect(onFileReject).toHaveBeenCalledWith({
        file: PNG,
        reason: "decode",
      }),
    )
    expect(onFileAccept).not.toHaveBeenCalled()
  })

  it("falls back to the image element when createImageBitmap fails", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.reject(new Error("unsupported"))),
    )
    stubImageDecode(() => Promise.resolve())
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() => expect(onFileAccept).toHaveBeenCalledTimes(1))
    expect(onFileReject).not.toHaveBeenCalled()
  })

  it("rejects through the image element without createImageBitmap", async () => {
    vi.stubGlobal("createImageBitmap", undefined)
    stubImageDecode(() => Promise.reject(new Error("bad image")))
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() =>
      expect(onFileReject).toHaveBeenCalledWith({
        file: PNG,
        reason: "decode",
      }),
    )
    expect(onFileAccept).not.toHaveBeenCalled()
  })

  it("accepts the file where no image decoder exists", async () => {
    vi.stubGlobal("createImageBitmap", undefined)
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() => expect(onFileAccept).toHaveBeenCalledTimes(1))
    expect(onFileReject).not.toHaveBeenCalled()
  })

  it("rejects a file that cannot be read", async () => {
    class FailingReader {
      error = new DOMException("denied", "NotReadableError")
      result = null
      onerror: (() => void) | null = null
      onload: (() => void) | null = null
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal("FileReader", FailingReader)
    const { onFileAccept, onFileReject } = choose(PNG)
    await waitFor(() =>
      expect(onFileReject).toHaveBeenCalledWith({ file: PNG, reason: "read" }),
    )
    expect(onFileAccept).not.toHaveBeenCalled()
  })
})
