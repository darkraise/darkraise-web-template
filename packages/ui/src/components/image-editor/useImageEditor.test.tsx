import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useImageEditor } from "./useImageEditor"
import { NEUTRAL_FILTERS, type FilterState } from "./types"

function makeStroke(id: string) {
  return {
    id,
    kind: "pen" as const,
    points: [{ x: 0, y: 0 }],
    color: "#000",
    width: 2,
    opacity: 1,
  }
}

describe("useImageEditor", () => {
  it("exposes the composed cropper API and editor defaults", () => {
    const { result } = renderHook(() => useImageEditor())
    expect(result.current.cropper.zoom).toBe(1)
    expect(result.current.filters).toEqual(NEUTRAL_FILTERS)
    expect(result.current.tool).toBe("crop")
    expect(result.current.annotations).toEqual([])
    expect(result.current.freeformPath).toBeNull()
    expect(result.current.perspective).toBeNull()
    expect(result.current.filterCss).toBe("none")
  })

  it("setFilter mutates a single channel", () => {
    const onFiltersChange = vi.fn()
    const { result } = renderHook(() => useImageEditor({ onFiltersChange }))
    act(() => result.current.setFilter("brightness", 1.25))
    expect(result.current.filters.brightness).toBe(1.25)
    expect(result.current.filterCss).toContain("brightness(1.25)")
    expect(onFiltersChange).toHaveBeenLastCalledWith({
      filters: { ...NEUTRAL_FILTERS, brightness: 1.25 },
    })
  })

  it("setFilters replaces the whole filter state", () => {
    const { result } = renderHook(() => useImageEditor())
    const next: FilterState = {
      brightness: 1.1,
      contrast: 0.9,
      saturation: 1.4,
      hueRotate: 30,
      blur: 2,
      grayscale: 0,
      sepia: 0,
    }
    act(() => result.current.setFilters(next))
    expect(result.current.filters).toEqual(next)
  })

  it("resetFilters restores the neutral identity", () => {
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.setFilter("contrast", 0.5))
    act(() => result.current.resetFilters())
    expect(result.current.filters).toEqual(NEUTRAL_FILTERS)
    expect(result.current.filterCss).toBe("none")
  })

  it("applyPreset by id and by object both work", () => {
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.applyPreset("bw"))
    expect(result.current.filters.grayscale).toBe(1)
    act(() =>
      result.current.applyPreset({
        id: "x",
        label: "x",
        filters: { sepia: 0.5 },
      }),
    )
    expect(result.current.filters.sepia).toBe(0.5)
  })

  it("filterCss composes only non-neutral channels", () => {
    const { result } = renderHook(() => useImageEditor())
    act(() =>
      result.current.setFilters({
        brightness: 1.2,
        contrast: 1,
        saturation: 1.3,
        hueRotate: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      }),
    )
    expect(result.current.filterCss).toBe("brightness(1.2) saturate(1.3)")
  })

  it("setTool switches the active tool", () => {
    const onToolChange = vi.fn()
    const { result } = renderHook(() => useImageEditor({ onToolChange }))
    act(() => result.current.setTool("annotate"))
    expect(result.current.tool).toBe("annotate")
    expect(onToolChange).toHaveBeenLastCalledWith({ tool: "annotate" })
  })

  it("annotation CRUD adds, updates, removes, clears", () => {
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.addAnnotation(makeStroke("a")))
    act(() => result.current.addAnnotation(makeStroke("b")))
    expect(result.current.annotations).toHaveLength(2)
    act(() => result.current.updateAnnotation("a", { color: "#f00" }))
    expect(result.current.annotations[0]?.color).toBe("#f00")
    act(() => result.current.removeAnnotation("a"))
    expect(result.current.annotations).toEqual([
      expect.objectContaining({ id: "b" }),
    ])
    act(() => result.current.clearAnnotations())
    expect(result.current.annotations).toEqual([])
  })

  it("freeform and perspective state setters round-trip", () => {
    const { result } = renderHook(() => useImageEditor())
    const path = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    }
    act(() => result.current.setFreeformPath(path))
    expect(result.current.freeformPath).toEqual(path)
    act(() => result.current.clearFreeformPath())
    expect(result.current.freeformPath).toBeNull()

    const corners = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomRight: { x: 100, y: 100 },
      bottomLeft: { x: 0, y: 100 },
    }
    act(() => result.current.setPerspective(corners))
    expect(result.current.perspective).toEqual(corners)
    act(() => result.current.resetPerspective())
    expect(result.current.perspective).toBeNull()
  })

  it("history pushes a snapshot and undo restores it", () => {
    const { result } = renderHook(() => useImageEditor())
    expect(result.current.canUndo).toBe(false)
    act(() => result.current.setFilter("brightness", 1.5))
    act(() => result.current.pushHistory())
    expect(result.current.canUndo).toBe(true)
    act(() => result.current.setFilter("brightness", 0.7))
    act(() => result.current.pushHistory())
    act(() => result.current.undo())
    expect(result.current.filters.brightness).toBe(1.5)
    act(() => result.current.undo())
    // Two undos returns to the seeded initial snapshot (neutral).
    expect(result.current.filters.brightness).toBe(1)
    expect(result.current.canUndo).toBe(false)
  })

  it("redo replays an undone change until a new push truncates the future", () => {
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.setFilter("contrast", 1.2))
    act(() => result.current.pushHistory())
    act(() => result.current.undo())
    expect(result.current.filters.contrast).toBe(1)
    expect(result.current.canRedo).toBe(true)
    act(() => result.current.redo())
    expect(result.current.filters.contrast).toBe(1.2)
    // Pushing after a redo doesn't fork — it just extends. Undo to the
    // seeded base, redo to the contrast=1.2 snapshot, then push a new
    // saturation change. Old cursor state shouldn't reappear on redo.
    act(() => result.current.setFilter("saturation", 1.3))
    act(() => result.current.pushHistory())
    expect(result.current.canRedo).toBe(false)
  })

  it("history honours the historyLimit", () => {
    const { result } = renderHook(() => useImageEditor({ historyLimit: 3 }))
    for (let i = 0; i < 10; i += 1) {
      act(() => result.current.setFilter("brightness", 1 + i * 0.05))
      act(() => result.current.pushHistory())
    }
    // With limit 3 we should only be able to undo at most 2 times beyond
    // the current snapshot before exhausting.
    let undoCount = 0
    while (result.current.canUndo && undoCount < 10) {
      act(() => result.current.undo())
      undoCount += 1
    }
    expect(undoCount).toBeLessThanOrEqual(2)
  })

  it("registers and runs an extension that returns a mask", async () => {
    const handler = vi.fn(async () => ({
      mask: { points: [{ x: 0, y: 0 }] },
    }))
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.registerExtension("magic-wand", handler))
    expect(result.current.hasExtension("magic-wand")).toBe(true)
    // Attach a stub image so runExtension can pass it through.
    result.current.cropper.imageRef.current = document.createElement("img")
    let output: { mask?: { points: { x: number; y: number }[] } } | null = null
    await act(async () => {
      output = await result.current.runExtension("magic-wand")
    })
    expect(handler).toHaveBeenCalledOnce()
    expect(output?.mask).toBeDefined()
  })

  it("returns null from runExtension for unknown handlers", async () => {
    const { result } = renderHook(() => useImageEditor())
    let out: unknown = "untouched"
    await act(async () => {
      out = await result.current.runExtension("missing")
    })
    expect(out).toBeNull()
  })

  it("getEditedImage delegates to cropper.getCroppedImage with filterCss", async () => {
    const { result } = renderHook(() => useImageEditor())
    // Mutate filters first so the cropper instance settles, then spy on the
    // current instance — useImageCropper returns a fresh object per render,
    // so spying before the last render leaves us patching a stale object.
    act(() => result.current.setFilter("brightness", 1.4))
    const spy = vi
      .spyOn(result.current.cropper, "getCroppedImage")
      .mockResolvedValue(null)
    await act(async () => {
      await result.current.getEditedImage({ output: "dataUrl" })
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        output: "dataUrl",
        filter: expect.stringContaining("brightness(1.4)"),
      }),
    )
    spy.mockRestore()
  })

  it("getEditedImage honours an explicit filter override", async () => {
    const { result } = renderHook(() => useImageEditor())
    const spy = vi
      .spyOn(result.current.cropper, "getCroppedImage")
      .mockResolvedValue(null)
    await act(async () => {
      await result.current.getEditedImage({ filter: "invert(1)" })
    })
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ filter: "invert(1)" }),
    )
    spy.mockRestore()
  })

  it("active annotation defaults and setters", () => {
    const { result } = renderHook(() => useImageEditor())
    expect(result.current.activeAnnotationKind).toBe("pen")
    expect(result.current.activeAnnotationColor).toBe("#ef4444")
    expect(result.current.activeAnnotationWidth).toBe(4)
    expect(result.current.activeAnnotationOpacity).toBe(1)
    act(() => result.current.setActiveAnnotationKind("highlighter"))
    expect(result.current.activeAnnotationKind).toBe("highlighter")
    expect(result.current.activeAnnotationOpacity).toBeCloseTo(0.4)
    act(() => result.current.setActiveAnnotationColor("#00ff00"))
    expect(result.current.activeAnnotationColor).toBe("#00ff00")
    act(() => result.current.setActiveAnnotationWidth(12))
    expect(result.current.activeAnnotationWidth).toBe(12)
  })

  it("getEditedImage forwards annotations through postDraw", async () => {
    const { result } = renderHook(() => useImageEditor())
    act(() =>
      result.current.addAnnotation({
        id: "a1",
        kind: "pen",
        color: "#ff0000",
        width: 4,
        opacity: 1,
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      }),
    )
    const spy = vi
      .spyOn(result.current.cropper, "getCroppedImage")
      .mockResolvedValue(null)
    await act(async () => {
      await result.current.getEditedImage()
    })
    const callArg = spy.mock.calls[0]?.[0]
    expect(callArg).toBeDefined()
    expect(typeof callArg?.postDraw).toBe("function")
    spy.mockRestore()
  })

  it("getEditedImage clips with freeformPath via destination-in", async () => {
    const { result } = renderHook(() => useImageEditor())
    act(() =>
      result.current.setFreeformPath({
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
      }),
    )
    const spy = vi
      .spyOn(result.current.cropper, "getCroppedImage")
      .mockResolvedValue(null)
    await act(async () => {
      await result.current.getEditedImage()
    })
    const callArg = spy.mock.calls[0]?.[0]
    expect(typeof callArg?.postDraw).toBe("function")
    spy.mockRestore()
  })

  it("runExtension applies a returned mask to freeformPath", async () => {
    const handler = vi.fn(async () => ({
      mask: {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
        ],
      },
    }))
    const { result } = renderHook(() => useImageEditor())
    act(() => result.current.registerExtension("magic-wand", handler))
    result.current.cropper.imageRef.current = document.createElement("img")
    await act(async () => {
      await result.current.runExtension("magic-wand")
    })
    expect(result.current.freeformPath?.points).toHaveLength(3)
  })

  it("merges additionalPresets after defaults", () => {
    const { result } = renderHook(() =>
      useImageEditor({
        additionalPresets: [
          { id: "custom", label: "Custom", filters: { hueRotate: 90 } },
        ],
      }),
    )
    expect(result.current.presets.at(-1)?.id).toBe("custom")
    act(() => result.current.applyPreset("custom"))
    expect(result.current.filters.hueRotate).toBe(90)
  })
})
