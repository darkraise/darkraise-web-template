import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import * as React from "react"
import {
  ImageEditor,
  ImageEditorAdjust,
  ImageEditorAdjustClear,
  ImageEditorAnnotationClear,
  ImageEditorAnnotationKind,
  ImageEditorAnnotationLayer,
  ImageEditorContext,
  ImageEditorFreeform,
  ImageEditorFreeformClear,
  ImageEditorPerspectiveOverlay,
  ImageEditorPerspectiveReset,
  ImageEditorPreset,
  ImageEditorRedo,
  ImageEditorRotationSlider,
  ImageEditorTools,
  ImageEditorUndo,
  ImageEditorViewport,
  useImageEditorContext,
  type ImageEditorProps,
} from "./index"
import {
  NEUTRAL_FILTERS,
  type AnnotationStroke,
  type PerspectiveCorners,
} from "./types"

describe("ImageEditorPreset", () => {
  // The theme paints [data-preset="<name>"] with a preset's tokens wherever
  // it sits, so a filter named like a theme preset must not carry it.
  it("names its filter without taking a theme preset's tokens", () => {
    render(
      <ImageEditor
        presets={[{ id: "soft-glass", label: "Soft glass", filters: {} }]}
      >
        <ImageEditorPreset preset="soft-glass" />
      </ImageEditor>,
    )
    const button = screen.getByRole("button", { name: "Soft glass" })
    expect(button).toHaveAttribute("data-filter-preset", "soft-glass")
    expect(button).not.toHaveAttribute("data-preset")
  })
})

describe("ImageEditor history round trips", () => {
  const stroke: AnnotationStroke = {
    id: "s1",
    kind: "pen",
    color: "#000000",
    width: 2,
    opacity: 1,
    points: [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ],
  }
  const corners: PerspectiveCorners = {
    topLeft: { x: 0, y: 0 },
    topRight: { x: 100, y: 0 },
    bottomRight: { x: 100, y: 80 },
    bottomLeft: { x: 0, y: 80 },
  }
  const path = {
    points: [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 30 },
    ],
  }

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    Element.prototype.setPointerCapture ??= () => {}
  })
  afterEach(() => vi.restoreAllMocks())

  function EditorState() {
    return (
      <ImageEditorContext>
        {(editor) => (
          <output data-testid="editor-state">
            {JSON.stringify({
              filters: editor.filters,
              rotation: editor.cropper.rotation,
              annotations: editor.annotations,
              freeformPath: editor.freeformPath,
              perspective: editor.perspective,
            })}
          </output>
        )}
      </ImageEditorContext>
    )
  }

  function readState(): unknown {
    return JSON.parse(screen.getByTestId("editor-state").textContent ?? "")
  }

  function renderEditor(
    children: React.ReactNode,
    props: Partial<ImageEditorProps> = {},
  ) {
    return render(
      <ImageEditor {...props}>
        <ImageEditorViewport>{children}</ImageEditorViewport>
        <ImageEditorUndo />
        <ImageEditorRedo />
        <EditorState />
      </ImageEditor>,
    )
  }

  function expectRoundTrip(before: unknown) {
    const after = readState()
    expect(after).not.toEqual(before)
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(readState()).toEqual(before)
    fireEvent.click(screen.getByRole("button", { name: "Redo" }))
    expect(readState()).toEqual(after)
  }

  it.each([
    {
      edit: "preset",
      children: <ImageEditorPreset preset="bw" />,
      props: {},
      button: "B&W",
    },
    {
      edit: "adjust clear",
      children: <ImageEditorAdjustClear />,
      props: { defaultFilters: { ...NEUTRAL_FILTERS, contrast: 1.4 } },
      button: "Clear",
    },
    {
      edit: "annotation clear",
      children: <ImageEditorAnnotationClear />,
      props: { defaultAnnotations: [stroke] },
      button: "Clear",
    },
    {
      edit: "freeform clear",
      children: <ImageEditorFreeformClear />,
      props: { defaultFreeformPath: path },
      button: "Clear selection",
    },
    {
      edit: "perspective reset",
      children: <ImageEditorPerspectiveReset />,
      props: { defaultPerspective: corners },
      button: "Reset perspective",
    },
  ])(
    "undo and redo restore a $edit pushed in the same click",
    ({ children, props, button }) => {
      renderEditor(children, props)
      const before = readState()
      fireEvent.click(screen.getByRole("button", { name: button }))
      expectRoundTrip(before)
    },
  )

  it("undo and redo restore a shape annotation", () => {
    renderEditor(
      <>
        <ImageEditorAnnotationKind kind="rectangle" />
        <ImageEditorAnnotationLayer data-testid="layer" />
      </>,
      { defaultTool: "annotate" },
    )
    fireEvent.click(screen.getByRole("radio", { name: "Rectangle" }))
    const before = readState()
    const layer = screen.getByTestId("layer")
    const pointer = { pointerId: 1, pointerType: "mouse", button: 0 }
    fireEvent.pointerDown(layer, { ...pointer, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(layer, { ...pointer, clientX: 40, clientY: 30 })
    fireEvent.pointerUp(layer, { ...pointer, clientX: 40, clientY: 30 })
    expectRoundTrip(before)
  })

  it("undo and redo restore a text annotation", () => {
    renderEditor(
      <>
        <ImageEditorAnnotationKind kind="text" />
        <ImageEditorAnnotationLayer data-testid="layer" />
      </>,
      { defaultTool: "annotate" },
    )
    fireEvent.click(screen.getByRole("radio", { name: "Text" }))
    const before = readState()
    fireEvent.pointerDown(screen.getByTestId("layer"), {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 12,
      clientY: 14,
    })
    const input = screen.getByPlaceholderText("Type, then Enter")
    fireEvent.change(input, { target: { value: "Label" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expectRoundTrip(before)
  })

  it("undo and redo restore a freeform selection", () => {
    renderEditor(<ImageEditorFreeform data-testid="freeform" />, {
      defaultTool: "freeform",
    })
    const before = readState()
    const svg = screen.getByTestId("freeform")
    const pointer = { pointerId: 1, pointerType: "mouse", button: 0 }
    fireEvent.pointerDown(svg, { ...pointer, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(svg, { ...pointer, clientX: 30, clientY: 0 })
    fireEvent.pointerMove(svg, { ...pointer, clientX: 30, clientY: 30 })
    fireEvent.pointerUp(svg, { ...pointer, clientX: 30, clientY: 30 })
    expectRoundTrip(before)
  })

  it.each([
    { control: "adjust", children: <ImageEditorAdjust channel="brightness" /> },
    { control: "rotation", children: <ImageEditorRotationSlider /> },
  ])(
    "undo and redo restore a keyboard change on the $control slider",
    ({ children }) => {
      renderEditor(children)
      const before = readState()
      fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" })
      expectRoundTrip(before)
    },
  )
})

describe("ImageEditor under StrictMode", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
    Element.prototype.setPointerCapture ??= () => {}
  })
  afterEach(() => vi.restoreAllMocks())

  function Counts() {
    return (
      <ImageEditorContext>
        {(editor) => (
          <output data-testid="counts">
            {`${editor.annotations.length} ${editor.freeformPath?.points.length ?? 0}`}
          </output>
        )}
      </ImageEditorContext>
    )
  }

  function renderStrict(
    children: React.ReactNode,
    props: Partial<ImageEditorProps>,
  ) {
    return render(
      <React.StrictMode>
        <ImageEditor {...props}>
          <ImageEditorViewport>{children}</ImageEditorViewport>
          <ImageEditorUndo />
          <Counts />
        </ImageEditor>
      </React.StrictMode>,
    )
  }

  function expectOneEntry(counts: string) {
    expect(screen.getByTestId("counts")).toHaveTextContent(counts)
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(screen.getByTestId("counts")).toHaveTextContent("0 0")
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
  }

  const pointer = { pointerId: 1, pointerType: "mouse", button: 0 }

  // The last move and the release share one act, so the release runs before
  // the move has rendered, as with a continuous pointermove in a browser. It
  // must commit the stroke the move drew, which only the draft ref holds.
  it("adds one stroke and one history entry per drawn stroke", () => {
    const onAnnotationsChange = vi.fn()
    renderStrict(<ImageEditorAnnotationLayer data-testid="layer" />, {
      defaultTool: "annotate",
      onAnnotationsChange,
    })
    const layer = screen.getByTestId("layer")
    fireEvent.pointerDown(layer, { ...pointer, clientX: 10, clientY: 10 })
    act(() => {
      fireEvent.pointerMove(layer, { ...pointer, clientX: 40, clientY: 30 })
      fireEvent.pointerUp(layer, { ...pointer, clientX: 40, clientY: 30 })
    })
    expect(onAnnotationsChange).toHaveBeenCalledTimes(1)
    expectOneEntry("1 0")
  })

  it("adds one text annotation and one history entry per commit", () => {
    const onAnnotationsChange = vi.fn()
    renderStrict(
      <>
        <ImageEditorAnnotationKind kind="text" />
        <ImageEditorAnnotationLayer data-testid="layer" />
      </>,
      { defaultTool: "annotate", onAnnotationsChange },
    )
    fireEvent.click(screen.getByRole("radio", { name: "Text" }))
    fireEvent.pointerDown(screen.getByTestId("layer"), {
      ...pointer,
      clientX: 12,
      clientY: 14,
    })
    const input = screen.getByPlaceholderText("Type, then Enter")
    act(() => {
      fireEvent.change(input, { target: { value: "Label" } })
      fireEvent.keyDown(input, { key: "Enter" })
    })
    expect(onAnnotationsChange).toHaveBeenCalledTimes(1)
    expectOneEntry("1 0")
  })

  it("sets the freeform path once with one history entry", () => {
    const onFreeformPathChange = vi.fn()
    renderStrict(<ImageEditorFreeform data-testid="freeform" />, {
      defaultTool: "freeform",
      onFreeformPathChange,
    })
    const svg = screen.getByTestId("freeform")
    fireEvent.pointerDown(svg, { ...pointer, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(svg, { ...pointer, clientX: 30, clientY: 0 })
    act(() => {
      fireEvent.pointerMove(svg, { ...pointer, clientX: 30, clientY: 30 })
      fireEvent.pointerUp(svg, { ...pointer, clientX: 30, clientY: 30 })
    })
    expect(onFreeformPathChange).toHaveBeenCalledTimes(1)
    expectOneEntry("0 3")
  })
})

describe("ImageEditor perspective corners", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture ??= () => {}
  })

  // A 400 × 400 viewport letterboxes an 800 × 600 image to x 0–400,
  // y 50–350, so 1% of the image is 4px across and 3px down.
  function Measured() {
    const { registerViewport, registerImage } =
      useImageEditorContext("Measured").cropper
    React.useEffect(() => {
      registerViewport({ width: 400, height: 400 })
      registerImage({ naturalWidth: 800, naturalHeight: 600 })
    }, [registerViewport, registerImage])
    return null
  }

  function renderPerspective(props: Partial<ImageEditorProps> = {}) {
    return render(
      <ImageEditor defaultTool="perspective" {...props}>
        <Measured />
        <ImageEditorTools tools={["crop", "perspective"]} />
        <ImageEditorPerspectiveOverlay />
        <ImageEditorPerspectiveReset />
        <ImageEditorUndo />
        <ImageEditorRedo />
      </ImageEditor>,
    )
  }

  function corner(name: string) {
    return screen.getByRole("button", { name })
  }

  function position(name: string) {
    const handle = corner(name)
    return [
      Number(handle.getAttribute("cx")),
      Number(handle.getAttribute("cy")),
    ]
  }

  function cornerCount() {
    return document.querySelectorAll("[data-corner]").length
  }

  function topLeft() {
    const handle = document.querySelector('[data-corner="topLeft"]')
    return [
      Number(handle?.getAttribute("cx")),
      Number(handle?.getAttribute("cy")),
    ]
  }

  it("names each corner handle and puts it in the tab order", () => {
    renderPerspective()
    for (const name of [
      "Top-left corner",
      "Top-right corner",
      "Bottom-right corner",
      "Bottom-left corner",
    ]) {
      expect(corner(name)).toHaveAttribute("tabindex", "0")
    }
    expect(position("Bottom-right corner")).toEqual([400, 350])
  })

  it("moves a corner by 1% of the image per arrow, 10% with Shift, clamped to the image", () => {
    renderPerspective()
    const handle = corner("Top-left corner")
    expect(position("Top-left corner")).toEqual([0, 50])
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(position("Top-left corner")).toEqual([4, 50])
    fireEvent.keyDown(handle, { key: "ArrowDown" })
    expect(position("Top-left corner")).toEqual([4, 53])
    fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true })
    expect(position("Top-left corner")).toEqual([44, 53])
    fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true })
    fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true })
    fireEvent.keyDown(handle, { key: "ArrowUp", shiftKey: true })
    expect(position("Top-left corner")).toEqual([0, 50])
  })

  it("pushes one history entry when the arrow key is released", () => {
    renderPerspective()
    const handle = corner("Top-left corner")
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled()
    fireEvent.keyUp(handle, { key: "ArrowRight" })
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(cornerCount()).toBe(0)
    fireEvent.click(screen.getByRole("button", { name: "Redo" }))
    expect(position("Top-left corner")).toEqual([8, 50])
  })

  it("resets the corners to the image rect and keeps them while the tool is open", () => {
    renderPerspective()
    const handle = corner("Top-left corner")
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    fireEvent.keyUp(handle, { key: "ArrowRight" })
    fireEvent.click(screen.getByRole("button", { name: "Reset perspective" }))
    expect(position("Top-left corner")).toEqual([0, 50])
    expect(position("Top-right corner")).toEqual([400, 50])
    expect(position("Bottom-right corner")).toEqual([400, 350])
    expect(position("Bottom-left corner")).toEqual([0, 350])
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(position("Top-left corner")).toEqual([4, 50])
  })

  it("seeds the corners on entering the tool, not after an undo to none", () => {
    renderPerspective({ defaultTool: "crop" })
    expect(cornerCount()).toBe(0)
    fireEvent.click(screen.getByRole("radio", { name: "Perspective" }))
    expect(topLeft()).toEqual([0, 50])
    const handle = document.querySelector('[data-corner="topLeft"]')
    const svg = (handle as SVGCircleElement).ownerSVGElement as SVGSVGElement
    const pointer = { pointerId: 1, pointerType: "mouse", button: 0 }
    fireEvent.pointerDown(handle as SVGCircleElement, pointer)
    fireEvent.pointerMove(svg, { ...pointer, clientX: 20, clientY: 70 })
    fireEvent.pointerUp(svg, pointer)
    expect(topLeft()).toEqual([20, 70])
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    expect(cornerCount()).toBe(0)
    fireEvent.click(screen.getByRole("radio", { name: "Crop" }))
    fireEvent.click(screen.getByRole("radio", { name: "Perspective" }))
    expect(topLeft()).toEqual([0, 50])
  })
})

describe("ImageEditor annotation defaults", () => {
  it("applies the default annotation kind, colour and width props", () => {
    render(
      <ImageEditor
        data-testid="editor"
        defaultAnnotationKind="arrow"
        defaultAnnotationColor="#00ff00"
        defaultAnnotationWidth={9}
      >
        <ImageEditorAnnotationKind kind="arrow" />
        <ImageEditorContext>
          {(editor) => (
            <output data-testid="annotation-style">
              {`${editor.activeAnnotationColor} ${editor.activeAnnotationWidth}`}
            </output>
          )}
        </ImageEditorContext>
      </ImageEditor>,
    )
    expect(screen.getByRole("radio", { name: "Arrow" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    expect(screen.getByTestId("annotation-style")).toHaveTextContent(
      "#00ff00 9",
    )
    expect(
      screen
        .getByTestId("editor")
        .getAttributeNames()
        .filter((name) => name.includes("annotation")),
    ).toEqual([])
  })
})

describe("ImageEditor slider names", () => {
  it("names the adjust and rotation sliders by their visible labels", () => {
    render(
      <ImageEditor>
        <ImageEditorAdjust channel="contrast" />
        <ImageEditorAdjust channel="sepia" label="Tone" />
        <ImageEditorRotationSlider />
      </ImageEditor>,
    )
    for (const name of ["Contrast", "Tone", "Rotation"]) {
      const slider = screen.getByRole("slider", { name })
      const labelId = slider.getAttribute("aria-labelledby") ?? ""
      expect(document.getElementById(labelId)).toHaveTextContent(name)
    }
  })
})
