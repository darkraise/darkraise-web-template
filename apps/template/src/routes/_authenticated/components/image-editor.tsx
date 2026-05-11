import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { imageCropperHandles } from "darkraise-ui/components/image-cropper"
import {
  ImageEditor,
  ImageEditorAdjustPanel,
  ImageEditorAnnotationLayer,
  ImageEditorAnnotationToolbar,
  ImageEditorContext,
  ImageEditorExtension,
  ImageEditorFreeform,
  ImageEditorFreeformClear,
  ImageEditorGrid,
  ImageEditorHandle,
  ImageEditorImage,
  ImageEditorPerspectiveOverlay,
  ImageEditorPerspectiveReset,
  ImageEditorPresets,
  ImageEditorRedo,
  ImageEditorRootProvider,
  ImageEditorRotationSlider,
  ImageEditorSelection,
  ImageEditorStatusBar,
  ImageEditorTools,
  ImageEditorUndo,
  ImageEditorViewport,
  useImageEditor,
  type ExtensionInput,
  type ExtensionOutput,
} from "darkraise-ui/components/image-editor"
import { Button } from "darkraise-ui/components/button"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/image-editor")(
  {
    component: ImageEditorPage,
  },
)

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"

// Reusable scaffolding — the editor compound's viewport + image. The crop
// selection is opt-in via `includeCrop` (default false) so feature-focused
// demos don't show a permanent crop grid that distracts from the demo's
// actual subject.
function EditorFrame({
  alt = "Sample",
  includeCrop = false,
}: {
  alt?: string
  includeCrop?: boolean
}) {
  return (
    <ImageEditorViewport>
      <ImageEditorImage src={SAMPLE_IMAGE} alt={alt} crossOrigin="anonymous" />
      {includeCrop && (
        <ImageEditorSelection>
          {imageCropperHandles.map((position) => (
            <ImageEditorHandle key={position} position={position} />
          ))}
          <ImageEditorGrid axis="horizontal" />
          <ImageEditorGrid axis="vertical" />
        </ImageEditorSelection>
      )}
    </ImageEditorViewport>
  )
}

function BasicExample() {
  return (
    <div className="max-w-md">
      <ImageEditor>
        <EditorFrame alt="Basic editor" includeCrop />
      </ImageEditor>
    </div>
  )
}

function AdjustPanelExample() {
  return (
    <div className="grid max-w-2xl gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <ImageEditor>
        <EditorFrame alt="Adjustable image" />
      </ImageEditor>
      <ImageEditor>
        <ImageEditorAdjustPanel />
      </ImageEditor>
    </div>
  )
}

function SharedAdjustExample() {
  // Both the viewport and the adjust panel render under the SAME editor
  // instance — that's the typical pattern. Drag a slider and watch the
  // image update in place.
  return (
    <div className="max-w-2xl">
      <ImageEditor>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
          <EditorFrame alt="Live adjust" />
          <ImageEditorAdjustPanel />
        </div>
      </ImageEditor>
    </div>
  )
}

function PresetsExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor>
        <EditorFrame alt="Preset preview" />
        <ImageEditorPresets />
      </ImageEditor>
    </div>
  )
}

function CustomPresetsExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor
        additionalPresets={[
          {
            id: "cool",
            label: "Cool",
            filters: { hueRotate: 200, saturation: 1.2 },
          },
          {
            id: "warm",
            label: "Warm",
            filters: { hueRotate: 20, saturation: 1.3, brightness: 1.05 },
          },
        ]}
      >
        <EditorFrame alt="Custom presets" />
        <ImageEditorPresets ids={["none", "cool", "warm"]} />
      </ImageEditor>
    </div>
  )
}

function ToolsExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor>
        <ImageEditorTools />
        <ImageEditorContext>
          {(api) => (
            <>
              <ImageEditorViewport>
                <ImageEditorImage src={SAMPLE_IMAGE} alt="Tool switcher" />
                {api.tool === "crop" && (
                  <ImageEditorSelection>
                    {imageCropperHandles.map((position) => (
                      <ImageEditorHandle key={position} position={position} />
                    ))}
                    <ImageEditorGrid axis="horizontal" />
                    <ImageEditorGrid axis="vertical" />
                  </ImageEditorSelection>
                )}
                {api.tool === "annotate" && <ImageEditorAnnotationLayer />}
                {api.tool === "freeform" && <ImageEditorFreeform />}
                {api.tool === "perspective" && (
                  <ImageEditorPerspectiveOverlay />
                )}
              </ImageEditorViewport>
              {api.tool === "adjust" && (
                <ImageEditorAdjustPanel
                  channels={["brightness", "contrast", "saturation"]}
                />
              )}
              {api.tool === "annotate" && <ImageEditorAnnotationToolbar />}
              {api.tool === "freeform" && <ImageEditorFreeformClear />}
              {api.tool === "perspective" && <ImageEditorPerspectiveReset />}
            </>
          )}
        </ImageEditorContext>
        <p className="text-muted-foreground text-xs">
          Each tool surfaces its own overlay and controls. Switching tools swaps
          the visible UI: Crop shows the selection and handles, Adjust shows the
          slider rack, Annotate shows the canvas plus toolbar, Freeform shows
          the path tracer, Perspective shows the corner handles.
        </p>
      </ImageEditor>
    </div>
  )
}

function RotationExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor>
        <EditorFrame alt="Free rotate" />
        <ImageEditorRotationSlider />
      </ImageEditor>
    </div>
  )
}

function AnnotationExample() {
  // Tool starts on annotate so the canvas captures pointers immediately;
  // the example focuses on annotation so the crop selection is omitted.
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor defaultTool="annotate">
        <ImageEditorViewport>
          <ImageEditorImage src={SAMPLE_IMAGE} alt="Annotatable" />
          <ImageEditorAnnotationLayer />
        </ImageEditorViewport>
        <ImageEditorAnnotationToolbar />
        <div className="flex gap-2">
          <ImageEditorUndo />
          <ImageEditorRedo />
        </div>
      </ImageEditor>
    </div>
  )
}

function FreeformExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor defaultTool="freeform">
        <ImageEditorViewport>
          <ImageEditorImage src={SAMPLE_IMAGE} alt="Freeform mask" />
          <ImageEditorFreeform />
        </ImageEditorViewport>
        <div className="flex gap-2">
          <ImageEditorFreeformClear />
          <ImageEditorUndo />
          <ImageEditorRedo />
        </div>
      </ImageEditor>
    </div>
  )
}

function PerspectiveExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor defaultTool="perspective">
        <ImageEditorViewport>
          <ImageEditorImage src={SAMPLE_IMAGE} alt="Perspective" />
          <ImageEditorPerspectiveOverlay />
        </ImageEditorViewport>
        <div className="flex gap-2">
          <ImageEditorPerspectiveReset />
          <ImageEditorUndo />
          <ImageEditorRedo />
        </div>
        <p className="text-muted-foreground text-xs">
          Drag the four corners. The live preview clips the image to the quad
          you define; the export pipeline applies a triangle-split affine warp
          so the rasterized output reflects the perspective.
        </p>
      </ImageEditor>
    </div>
  )
}

// Stubbed posterize extension — demonstrates the ImageEditorExtension wiring
// without bringing a heavy ML model. A real consumer would swap this for
// background removal (transformers.js / API call) or magic-wand selection.
async function posterizeExtension(
  input: ExtensionInput,
): Promise<ExtensionOutput> {
  if (typeof OffscreenCanvas === "undefined") return {}
  const w =
    input.image instanceof HTMLImageElement
      ? input.image.naturalWidth
      : (input.image as ImageBitmap).width
  const h =
    input.image instanceof HTMLImageElement
      ? input.image.naturalHeight
      : (input.image as ImageBitmap).height
  if (!w || !h) return {}
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext("2d")
  if (!ctx) return {}
  ctx.drawImage(input.image as CanvasImageSource, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const levels = 4
  const step = 256 / levels
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = Math.round((data.data[i] ?? 0) / step) * step
    data.data[i + 1] = Math.round((data.data[i + 1] ?? 0) / step) * step
    data.data[i + 2] = Math.round((data.data[i + 2] ?? 0) / step) * step
  }
  ctx.putImageData(data, 0, 0)
  const bitmap = canvas.transferToImageBitmap()
  return { image: bitmap }
}

function ExtensionsExample() {
  const editor = useImageEditor({
    extensions: { posterize: posterizeExtension },
  })
  return (
    <div className="max-w-md space-y-3">
      <ImageEditorRootProvider value={editor}>
        <EditorFrame alt="Extension target" />
        <div className="flex flex-wrap gap-2">
          <ImageEditorExtension name="posterize">
            Posterize
          </ImageEditorExtension>
          <ImageEditorUndo />
          <ImageEditorRedo />
        </div>
      </ImageEditorRootProvider>
      <p className="text-muted-foreground text-xs">
        Extensions plug arbitrary canvas/AI work into the editor. The posterize
        stub here quantises each channel to four levels via OffscreenCanvas;
        consumers swap this for background removal or magic-wand selection. The
        result is applied to the export pipeline, and any returned mask becomes
        the freeform path.
      </p>
    </div>
  )
}

function StatusBarExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor>
        <EditorFrame alt="Status bar" includeCrop />
        <ImageEditorStatusBar visible={visible} />
      </ImageEditor>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-xs underline"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Hide status bar" : "Show status bar"}
      </button>
    </div>
  )
}

function HistoryExample() {
  return (
    <div className="max-w-md space-y-3">
      <ImageEditor>
        <EditorFrame alt="Undo/redo" />
        <ImageEditorAdjustPanel
          channels={["brightness", "contrast", "saturation"]}
        />
        <div className="flex gap-2">
          <ImageEditorUndo />
          <ImageEditorRedo />
        </div>
      </ImageEditor>
    </div>
  )
}

function ExportExample() {
  // External hook so a sibling button can call getEditedImage(). The button
  // would need access to the editor API — RootProvider is the canonical
  // pattern for that.
  const editor = useImageEditor()
  const [preview, setPreview] = useState<string | null>(null)

  const handleExport = async () => {
    const url = await editor.getEditedImage({ output: "dataUrl" })
    if (typeof url === "string") setPreview(url)
  }

  return (
    <div className="space-y-3">
      <div className="grid max-w-2xl gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <ImageEditorRootProvider value={editor}>
          <EditorFrame alt="Export source" includeCrop />
        </ImageEditorRootProvider>
        <ImageEditorRootProvider value={editor}>
          <ImageEditorAdjustPanel
            channels={["brightness", "contrast", "saturation", "hueRotate"]}
          />
          <ImageEditorPresets ids={["none", "vivid", "bw", "sepia"]} />
        </ImageEditorRootProvider>
      </div>
      <Button onClick={handleExport}>Export edited image</Button>
      <div className="bg-muted flex min-h-32 items-center justify-center rounded-md p-3">
        {preview ? (
          <img
            src={preview}
            alt="Edited preview"
            className="max-h-64 rounded shadow-sm"
          />
        ) : (
          <span className="text-muted-foreground text-xs">
            Adjust filters and click Export to render the result.
          </span>
        )}
      </div>
    </div>
  )
}

function FullEditorExample() {
  // The everything-wired example. Same editor instance threaded through
  // RootProvider into multiple subtrees so the toolbar, viewport, and
  // adjust panel all read and mutate one source of truth.
  const editor = useImageEditor({ aspectRatio: 4 / 3 })

  return (
    <div className="space-y-3">
      <ImageEditorRootProvider value={editor}>
        <div className="flex flex-wrap items-center gap-2">
          <ImageEditorTools tools={["crop", "adjust"]} />
          <div className="ml-auto flex gap-2">
            <ImageEditorUndo />
            <ImageEditorRedo />
          </div>
        </div>
      </ImageEditorRootProvider>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <ImageEditorRootProvider value={editor}>
          <EditorFrame alt="Full editor" includeCrop />
        </ImageEditorRootProvider>
        <ImageEditorRootProvider value={editor}>
          <div className="space-y-3">
            <ImageEditorPresets
              ids={["none", "vivid", "muted", "bw", "sepia", "vintage"]}
            />
            <ImageEditorAdjustPanel />
            <ImageEditorRotationSlider />
          </div>
        </ImageEditorRootProvider>
      </div>
    </div>
  )
}

function ImageEditorPage() {
  return (
    <ShowcasePage
      title="Image Editor"
      description="Composes ImageCropper with a filter chain, named presets, free-rotate, undo/redo, a tool switcher, and getEditedImage(). Annotation, freeform selection, perspective correction, and AI hooks ship in later phases."
    >
      <ShowcaseExample title="Basic" code={BASIC_CODE}>
        <BasicExample />
      </ShowcaseExample>

      <ShowcaseExample title="Adjust panel" code={ADJUST_CODE}>
        <SharedAdjustExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Adjust panel (separate instances)"
        code={ADJUST_SEPARATE_CODE}
      >
        <AdjustPanelExample />
      </ShowcaseExample>

      <ShowcaseExample title="Presets" code={PRESETS_CODE}>
        <PresetsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Custom presets" code={CUSTOM_PRESETS_CODE}>
        <CustomPresetsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Tools switcher" code={TOOLS_CODE}>
        <ToolsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Free-rotate" code={ROTATION_CODE}>
        <RotationExample />
      </ShowcaseExample>

      <ShowcaseExample title="Status bar" code={STATUS_BAR_CODE}>
        <StatusBarExample />
      </ShowcaseExample>

      <ShowcaseExample title="Annotation" code={ANNOTATION_CODE}>
        <AnnotationExample />
      </ShowcaseExample>

      <ShowcaseExample title="Freeform selection" code={FREEFORM_CODE}>
        <FreeformExample />
      </ShowcaseExample>

      <ShowcaseExample title="Perspective correction" code={PERSPECTIVE_CODE}>
        <PerspectiveExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Extensions (posterize stub)"
        code={EXTENSION_CODE}
      >
        <ExtensionsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Undo / redo" code={HISTORY_CODE}>
        <HistoryExample />
      </ShowcaseExample>

      <ShowcaseExample title="Export edited image" code={EXPORT_CODE}>
        <ExportExample />
      </ShowcaseExample>

      <ShowcaseExample title="Full editor" code={FULL_CODE}>
        <FullEditorExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

const BASIC_CODE = `<ImageEditor>
  <ImageEditorViewport>
    <ImageEditorImage src={SAMPLE_IMAGE} alt="Sample" />
    <ImageEditorSelection>
      {imageCropperHandles.map((position) => (
        <ImageEditorHandle key={position} position={position} />
      ))}
      <ImageEditorGrid axis="horizontal" />
      <ImageEditorGrid axis="vertical" />
    </ImageEditorSelection>
  </ImageEditorViewport>
</ImageEditor>`

const ADJUST_CODE = `// Render the viewport and the adjust panel under the SAME ImageEditor
// instance so the slider scrubs the live image. This is the most common
// layout — adjust + crop side by side.
<ImageEditor>
  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
    <ImageEditorViewport>...</ImageEditorViewport>
    <ImageEditorAdjustPanel />
  </div>
</ImageEditor>`

const ADJUST_SEPARATE_CODE = `// Two independent ImageEditor instances, each with its own state. Useful
// for pages with multiple editors or for read-only "before/after" panels.
<ImageEditor>
  <ImageEditorViewport>...</ImageEditorViewport>
</ImageEditor>
<ImageEditor>
  <ImageEditorAdjustPanel />
</ImageEditor>`

const PRESETS_CODE = `// Default presets: Original, Vivid, Muted, B&W, Sepia, Vintage. Clicking
// a preset writes through filter state setters and pushes one history
// entry so undo restores the previous adjustment in a single step.
<ImageEditor>
  <ImageEditorViewport>...</ImageEditorViewport>
  <ImageEditorPresets />
</ImageEditor>`

const CUSTOM_PRESETS_CODE = `<ImageEditor
  additionalPresets={[
    { id: "cool", label: "Cool", filters: { hueRotate: 200, saturation: 1.2 } },
    { id: "warm", label: "Warm", filters: { hueRotate: 20, saturation: 1.3 } },
  ]}
>
  <ImageEditorViewport>...</ImageEditorViewport>
  <ImageEditorPresets ids={["none", "cool", "warm"]} />
</ImageEditor>`

const TOOLS_CODE = `<ImageEditor>
  <ImageEditorTools />
  <ImageEditorViewport>...</ImageEditorViewport>
</ImageEditor>`

const ROTATION_CODE = `<ImageEditor>
  <ImageEditorViewport>...</ImageEditorViewport>
  <ImageEditorRotationSlider />
</ImageEditor>`

const HISTORY_CODE = `<ImageEditor>
  <ImageEditorViewport>...</ImageEditorViewport>
  <ImageEditorAdjustPanel channels={["brightness", "contrast", "saturation"]} />
  <ImageEditorUndo />
  <ImageEditorRedo />
</ImageEditor>`

const STATUS_BAR_CODE = `// The status bar reads from editor state: image natural dimensions,
// MIME type (auto-detected from the src), current zoom, and (optionally)
// rotation. Toggle via the \`visible\` prop. Pass \`items\` to choose which
// built-in stats to show, or \`extraItems\` to append custom entries.
const [visible, setVisible] = useState(true)

<ImageEditor>
  <ImageEditorViewport>...</ImageEditorViewport>
  <ImageEditorStatusBar visible={visible} />
</ImageEditor>
<button onClick={() => setVisible(v => !v)}>Toggle status bar</button>`

const FREEFORM_CODE = `// Trace a closed path while in freeform mode; getEditedImage clips the
// destination to that path via globalCompositeOperation = "destination-in".
<ImageEditor defaultTool="freeform">
  <ImageEditorViewport>
    <ImageEditorImage src={SAMPLE_IMAGE} alt="Freeform" />
    <ImageEditorFreeform />
  </ImageEditorViewport>
  <ImageEditorFreeformClear />
</ImageEditor>`

const PERSPECTIVE_CODE = `// Drag the four corner handles. The live preview clips the image to the
// quad; export applies a triangle-split affine warp so the rasterised
// output reflects the perspective.
<ImageEditor defaultTool="perspective">
  <ImageEditorViewport>
    <ImageEditorImage src={SAMPLE_IMAGE} alt="Perspective" />
    <ImageEditorPerspectiveOverlay />
  </ImageEditorViewport>
  <ImageEditorPerspectiveReset />
</ImageEditor>`

const EXTENSION_CODE = `// Register an extension up-front via the extensions option, or call
// editor.registerExtension(name, handler) at runtime. Returned image
// bitmaps swap the canvas-pipeline source; returned masks become the
// freeform path.
async function posterizeExtension(input: ExtensionInput): Promise<ExtensionOutput> {
  // ...quantise each channel via OffscreenCanvas...
  return { image: bitmap }
}

const editor = useImageEditor({
  extensions: { posterize: posterizeExtension },
})

<ImageEditorRootProvider value={editor}>
  <EditorFrame />
</ImageEditorRootProvider>
<ImageEditorExtension name="posterize">Posterize</ImageEditorExtension>`

const ANNOTATION_CODE = `// The annotation canvas overlays the viewport. Each completed stroke
// pushes one history entry. The crop selection is omitted here because
// the demo is focused on annotation; render an ImageEditorSelection
// alongside if you want both surfaces interactive.
<ImageEditor defaultTool="annotate">
  <ImageEditorViewport>
    <ImageEditorImage src={SAMPLE_IMAGE} alt="Annotatable" />
    <ImageEditorAnnotationLayer />
  </ImageEditorViewport>
  <ImageEditorAnnotationToolbar />
  <ImageEditorUndo />
  <ImageEditorRedo />
</ImageEditor>`

const EXPORT_CODE = `// External hook so the export button can call getEditedImage(). Pass it
// to multiple <ImageEditorRootProvider> subtrees and they all share state.
const editor = useImageEditor()
const [preview, setPreview] = useState<string | null>(null)

const handleExport = async () => {
  const url = await editor.getEditedImage({ output: "dataUrl" })
  if (typeof url === "string") setPreview(url)
}

<ImageEditorRootProvider value={editor}>
  <ImageEditorViewport>...</ImageEditorViewport>
</ImageEditorRootProvider>
<ImageEditorRootProvider value={editor}>
  <ImageEditorAdjustPanel />
  <ImageEditorPresets />
</ImageEditorRootProvider>
<Button onClick={handleExport}>Export edited image</Button>
{preview && <img src={preview} alt="Edited preview" />}`

const FULL_CODE = `const editor = useImageEditor({ aspectRatio: 4 / 3 })

<ImageEditorRootProvider value={editor}>
  <ImageEditorTools tools={["crop", "adjust"]} />
  <ImageEditorUndo />
  <ImageEditorRedo />
</ImageEditorRootProvider>
<ImageEditorRootProvider value={editor}>
  <ImageEditorViewport>...</ImageEditorViewport>
</ImageEditorRootProvider>
<ImageEditorRootProvider value={editor}>
  <ImageEditorPresets />
  <ImageEditorAdjustPanel />
  <ImageEditorRotationSlider />
</ImageEditorRootProvider>`
