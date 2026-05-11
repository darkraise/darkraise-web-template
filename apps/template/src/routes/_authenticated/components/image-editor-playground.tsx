import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Box,
  Crop,
  Download,
  ImagePlus,
  Lasso,
  PenTool,
  SlidersHorizontal,
  Upload,
} from "lucide-react"
import { imageCropperHandles } from "darkraise-ui/components/image-cropper"
import { ImageDropzone } from "darkraise-ui/components/image-common"
import {
  ImageEditorAdjustClear,
  ImageEditorAdjustPanel,
  ImageEditorAnnotationLayer,
  ImageEditorAnnotationToolbar,
  ImageEditorContext,
  ImageEditorPanel,
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
} from "darkraise-ui/components/image-editor"
import { Button } from "darkraise-ui/components/button"

export const Route = createFileRoute(
  "/_authenticated/components/image-editor-playground",
)({
  component: ImageEditorPlaygroundPage,
})

function ImageEditorPlaygroundPage() {
  const [src, setSrc] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showStatusBar, setShowStatusBar] = useState(true)
  const editor = useImageEditor({})

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const url = await editor.getEditedImage({
        output: "dataUrl",
        type: "image/png",
      })
      if (typeof url === "string") setPreview(url)
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = () => {
    if (!preview) return
    const link = document.createElement("a")
    link.href = preview
    link.download = `edited-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleNewFile = () => {
    setSrc(null)
    setPreview(null)
  }

  // Initial state — drop or browse for an image. The cropper's dropzone is
  // re-used here because file acquisition is a cropper-domain feature; the
  // editor inherits it through composition.
  if (!src) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Image Editor Playground
          </h1>
          <p className="text-muted-foreground text-sm">
            Drop an image or click to browse. Once loaded you can crop, adjust,
            rotate, annotate, freeform-mask, perspective-warp, and export the
            result.
          </p>
        </header>
        <ImageDropzone
          onFileAccept={(d) => setSrc(d.dataUrl)}
          maxSize={20 * 1024 * 1024}
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          className="min-h-72"
        >
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="text-muted-foreground h-8 w-8" />
            <span className="font-medium">
              Drop an image here, or click to browse
            </span>
            <span className="text-muted-foreground text-xs">
              PNG, JPEG, WebP, AVIF, or GIF · up to 20 MB
            </span>
          </div>
        </ImageDropzone>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <ImageEditorRootProvider value={editor}>
        {/* Top toolbar — file actions on the left, history + export on the
            right. The tool switcher sits between viewport and side panel. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleNewFile}>
              <Upload className="mr-1 h-4 w-4" />
              New file
            </Button>
            <ImageEditorTools />
          </div>
          <div className="flex items-center gap-2">
            <ImageEditorUndo />
            <ImageEditorRedo />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStatusBar((v) => !v)}
            >
              {showStatusBar ? "Hide status" : "Show status"}
            </Button>
            <Button size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting…" : "Export"}
            </Button>
            {preview && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="mr-1 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>

        <ImageEditorStatusBar visible={showStatusBar} />

        {/* Editor surface — viewport on the left, tool-specific control
            panel on the right. Both subtrees consume the same editor via
            <ImageEditorContext>'s render-prop so they swap in lockstep
            with the active tool. */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ImageEditorContext>
            {(api) => (
              <ImageEditorViewport
                // Override the cropper's default aspect-square: pin the
                // viewport to a viewport-relative height so the entire
                // image fits on screen between the toolbar and preview
                // without forcing the page to scroll. Image inside still
                // renders via object-contain so any natural aspect fits.
                style={{ aspectRatio: "auto", height: "min(65vh, 700px)" }}
              >
                <ImageEditorImage
                  src={src}
                  alt="Editing"
                  crossOrigin="anonymous"
                />
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
            )}
          </ImageEditorContext>

          <ImageEditorContext>
            {(api) => (
              <aside className="flex flex-col gap-3">
                {api.tool === "crop" && (
                  <ImageEditorPanel
                    title="Transform"
                    icon={<Crop className="h-3.5 w-3.5" />}
                  >
                    <div className="space-y-3">
                      <ImageEditorRotationSlider />
                      <p className="text-muted-foreground text-xs">
                        Drag the selection to move it, drag a handle to resize,
                        drag the bare image to pan, scroll or pinch to zoom,
                        arrow keys to nudge.
                      </p>
                    </div>
                  </ImageEditorPanel>
                )}
                {api.tool === "adjust" && (
                  <>
                    <ImageEditorPanel
                      title="Presets"
                      icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                    >
                      <ImageEditorPresets />
                    </ImageEditorPanel>
                    <ImageEditorPanel
                      title="Adjust"
                      icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                      action={<ImageEditorAdjustClear />}
                    >
                      <ImageEditorAdjustPanel />
                    </ImageEditorPanel>
                  </>
                )}
                {api.tool === "annotate" && (
                  <ImageEditorPanel
                    title="Annotate"
                    icon={<PenTool className="h-3.5 w-3.5" />}
                  >
                    <ImageEditorAnnotationToolbar />
                  </ImageEditorPanel>
                )}
                {api.tool === "freeform" && (
                  <ImageEditorPanel
                    title="Freeform selection"
                    icon={<Lasso className="h-3.5 w-3.5" />}
                    action={<ImageEditorFreeformClear />}
                  >
                    <p className="text-muted-foreground text-xs">
                      Draw a closed path on the image. The export will clip to
                      the masked region.
                    </p>
                  </ImageEditorPanel>
                )}
                {api.tool === "perspective" && (
                  <ImageEditorPanel
                    title="Perspective"
                    icon={<Box className="h-3.5 w-3.5" />}
                    action={<ImageEditorPerspectiveReset />}
                  >
                    <p className="text-muted-foreground text-xs">
                      Drag the four corner handles to define the destination
                      quad. The image clips to the quad in the live preview;
                      export applies a triangle-split affine warp.
                    </p>
                  </ImageEditorPanel>
                )}
              </aside>
            )}
          </ImageEditorContext>
        </div>
      </ImageEditorRootProvider>

      {/* Preview block — shown after the first export and updated on every
          subsequent export. Always visible below so the user can compare. */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Export preview</h2>
        <div className="bg-muted flex min-h-48 items-center justify-center rounded-md p-4">
          {preview ? (
            <img
              src={preview}
              alt="Edited"
              className="max-h-96 rounded shadow-sm"
            />
          ) : (
            <span className="text-muted-foreground text-xs">
              Click Export to render the current edits.
            </span>
          )}
        </div>
      </section>
    </div>
  )
}
