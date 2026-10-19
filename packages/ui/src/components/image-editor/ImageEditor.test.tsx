import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
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
  ImageEditorPerspectiveReset,
  ImageEditorPreset,
  ImageEditorRedo,
  ImageEditorRotationSlider,
  ImageEditorUndo,
  ImageEditorViewport,
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
