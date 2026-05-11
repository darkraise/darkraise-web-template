import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  RotateCw,
  Scissors,
  Square,
  ZoomIn,
} from "lucide-react"
import {
  ImageCropper,
  ImageCropperContext,
  ImageCropperDimensions,
  ImageCropperDropzone,
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRootProvider,
  ImageCropperSelection,
  ImageCropperViewport,
  imageCropperHandles,
  useImageCropper,
} from "darkraise-ui/components/image-cropper"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "darkraise-ui/components/toggle-group"
import { Button } from "darkraise-ui/components/button"
import { Slider } from "darkraise-ui/components/slider"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/image-cropper",
)({
  component: ImageCropperPage,
})

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"

// Reusable visual scaffolding — every example renders the same compound
// inside its <ImageCropper>; only the props on the Root differ.
function CropFrame({ alt = "Sample" }: { alt?: string }) {
  return (
    <ImageCropperViewport>
      <ImageCropperImage src={SAMPLE_IMAGE} alt={alt} crossOrigin="anonymous" />
      <ImageCropperSelection>
        {imageCropperHandles.map((position) => (
          <ImageCropperHandle key={position} position={position} />
        ))}
        <ImageCropperGrid axis="horizontal" />
        <ImageCropperGrid axis="vertical" />
      </ImageCropperSelection>
    </ImageCropperViewport>
  )
}

function BasicExample() {
  return (
    <div className="max-w-md">
      <ImageCropper>
        <CropFrame alt="Basic crop" />
      </ImageCropper>
    </div>
  )
}

const ASPECTS = [
  { label: "16:9", value: 16 / 9, icon: RectangleHorizontal },
  { label: "1:1", value: 1, icon: Square },
  { label: "9:16", value: 9 / 16, icon: RectangleVertical },
]

function AspectRatioExample() {
  const [aspect, setAspect] = useState(16 / 9)
  return (
    <div className="max-w-md space-y-3">
      <ToggleGroup
        type="single"
        value={String(aspect)}
        onValueChange={(v) => {
          if (v) setAspect(Number.parseFloat(v))
        }}
      >
        {ASPECTS.map((a) => (
          <ToggleGroupItem key={a.label} value={String(a.value)}>
            <a.icon className="mr-1 h-4 w-4" />
            {a.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ImageCropper aspectRatio={aspect}>
        <CropFrame alt="Aspect-ratio crop" />
      </ImageCropper>
    </div>
  )
}

function CircleExample() {
  return (
    <div className="max-w-md">
      <ImageCropper cropShape="circle" aspectRatio={1}>
        <CropFrame alt="Circle crop" />
      </ImageCropper>
    </div>
  )
}

function ContextExample() {
  return (
    <div className="max-w-md">
      <ImageCropper>
        <CropFrame alt="Context-aware" />
        <ImageCropperContext>
          {(api) => (
            <div className="bg-muted text-muted-foreground rounded-md p-2 text-xs">
              <span className="text-foreground font-medium">Selection</span>
              {" — "}
              {Math.round(api.crop.x)}, {Math.round(api.crop.y)} ·{" "}
              {Math.round(api.crop.width)} × {Math.round(api.crop.height)} ·
              zoom {api.zoom.toFixed(2)}
            </div>
          )}
        </ImageCropperContext>
      </ImageCropper>
    </div>
  )
}

function ControlledZoomExample() {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <ZoomIn className="text-muted-foreground h-4 w-4" />
        <Slider
          value={[zoom]}
          onValueChange={(v) => setZoom(v[0] ?? 1)}
          min={1}
          max={5}
          step={0.05}
        />
        <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
          {zoom.toFixed(2)}×
        </span>
      </div>
      <ImageCropper zoom={zoom} onZoomChange={(d) => setZoom(d.zoom)}>
        <CropFrame alt="Externally controlled zoom" />
      </ImageCropper>
    </div>
  )
}

function CropPreviewExample() {
  const cropper = useImageCropper()
  const [preview, setPreview] = useState<string | null>(null)

  const handleCrop = async () => {
    const url = await cropper.getCroppedImage({ output: "dataUrl" })
    if (typeof url === "string") setPreview(url)
  }

  return (
    <div className="space-y-3">
      <div className="max-w-md">
        <ImageCropperRootProvider value={cropper}>
          <CropFrame alt="Crop preview source" />
        </ImageCropperRootProvider>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={handleCrop}>
          <Scissors className="mr-1 h-4 w-4" />
          Crop image
        </Button>
        <span className="text-muted-foreground text-xs">
          getCroppedImage rasterises the selected rectangle through the same
          transform pipeline as the live preview.
        </span>
      </div>
      <div className="bg-muted flex items-center justify-center overflow-hidden rounded-md p-3 text-xs">
        {preview ? (
          <img
            src={preview}
            alt="Cropped preview"
            className="max-h-64 rounded shadow-sm"
          />
        ) : (
          <span className="text-muted-foreground">
            No preview yet — adjust the crop and click Crop image.
          </span>
        )}
      </div>
    </div>
  )
}

function EventsExample() {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  return (
    <div className="grid max-w-2xl gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
      <ImageCropper
        onCropChange={(d) => setCrop(d.crop)}
        onZoomChange={(d) => setZoom(d.zoom)}
        onRotationChange={(d) => setRotation(d.rotation)}
      >
        <CropFrame alt="Events" />
      </ImageCropper>
      <dl className="bg-muted text-muted-foreground space-y-1 rounded-md p-3 text-xs">
        <div className="flex justify-between">
          <dt>Zoom</dt>
          <dd className="text-foreground tabular-nums">{zoom.toFixed(2)}×</dd>
        </div>
        <div className="flex justify-between">
          <dt>Rotation</dt>
          <dd className="text-foreground tabular-nums">{rotation}°</dd>
        </div>
        <div className="flex justify-between">
          <dt>Position</dt>
          <dd className="text-foreground tabular-nums">
            {Math.round(crop.x)}, {Math.round(crop.y)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Size</dt>
          <dd className="text-foreground tabular-nums">
            {Math.round(crop.width)} × {Math.round(crop.height)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function FixedExample() {
  return (
    <div className="max-w-md space-y-2">
      <ImageCropper
        fixedCropArea
        initialCrop={{ x: 40, y: 40, width: 200, height: 200 }}
      >
        <CropFrame alt="Fixed crop area" />
      </ImageCropper>
      <p className="text-muted-foreground text-xs">
        Selection is locked. Pan the image and zoom to compose; handles are
        hidden and the rect can't be moved or resized.
      </p>
    </div>
  )
}

function FlipExample() {
  const cropper = useImageCropper()
  return (
    <div className="max-w-md space-y-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cropper.flipHorizontal()}
          aria-pressed={cropper.flip.horizontal}
        >
          Flip horizontal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => cropper.flipVertical()}
          aria-pressed={cropper.flip.vertical}
        >
          Flip vertical
        </Button>
      </div>
      <ImageCropperRootProvider value={cropper}>
        <CropFrame alt="Flippable image" />
      </ImageCropperRootProvider>
    </div>
  )
}

function InitialCropExample() {
  return (
    <div className="max-w-md">
      <ImageCropper initialCrop={{ x: 80, y: 60, width: 240, height: 160 }}>
        <CropFrame alt="Initial crop" />
      </ImageCropper>
    </div>
  )
}

function MinMaxSizeExample() {
  return (
    <div className="max-w-md space-y-2">
      <ImageCropper
        minWidth={120}
        minHeight={120}
        maxWidth={260}
        maxHeight={260}
      >
        <CropFrame alt="Bounded crop" />
      </ImageCropper>
      <p className="text-muted-foreground text-xs">
        Selection clamps to a 120 px floor and a 260 px ceiling on both axes.
      </p>
    </div>
  )
}

function ResetExample() {
  const initial = { x: 60, y: 60, width: 200, height: 200 }
  const cropper = useImageCropper({
    initialCrop: initial,
    defaultZoom: 1,
    defaultRotation: 0,
  })

  const handleReset = () => {
    cropper.setZoom(1)
    cropper.setRotation(0)
    cropper.setFlip({ horizontal: false, vertical: false })
    cropper.setImagePosition({ x: 0, y: 0 })
    cropper.setCrop(initial)
  }

  return (
    <div className="max-w-md space-y-3">
      <Button variant="outline" size="sm" onClick={handleReset}>
        Reset
      </Button>
      <ImageCropperRootProvider value={cropper}>
        <CropFrame alt="Resettable crop" />
      </ImageCropperRootProvider>
    </div>
  )
}

function RootProviderExample() {
  const cropper = useImageCropper({ aspectRatio: 4 / 3 })
  return (
    <div className="max-w-md space-y-2">
      <ImageCropperRootProvider value={cropper}>
        <CropFrame alt="External hook" />
      </ImageCropperRootProvider>
      <p className="text-muted-foreground text-xs">
        State lives in <code>useImageCropper()</code> outside the tree, so
        siblings (toolbars, modal triggers) can read and mutate it without prop
        drilling.
      </p>
    </div>
  )
}

function RotationExample() {
  const cropper = useImageCropper()
  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cropper.rotateBy(-90)}
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          -90°
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => cropper.rotateBy(90)}
        >
          <RotateCw className="mr-1 h-4 w-4" />
          +90°
        </Button>
        <span className="text-muted-foreground text-xs tabular-nums">
          {cropper.rotation}°
        </span>
      </div>
      <ImageCropperRootProvider value={cropper}>
        <CropFrame alt="Rotatable image" />
      </ImageCropperRootProvider>
    </div>
  )
}

function ZoomLimitsExample() {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <ZoomIn className="text-muted-foreground h-4 w-4" />
        <Slider
          value={[zoom]}
          onValueChange={(v) => setZoom(v[0] ?? 1)}
          min={1}
          max={3}
          step={0.05}
        />
        <span className="text-muted-foreground w-14 text-right text-xs tabular-nums">
          {zoom.toFixed(2)}×
        </span>
      </div>
      <ImageCropper
        zoom={zoom}
        onZoomChange={(d) => setZoom(d.zoom)}
        minZoom={1}
        maxZoom={3}
        zoomStep={0.05}
      >
        <CropFrame alt="Bounded zoom" />
      </ImageCropper>
    </div>
  )
}

function DimensionsBadgeExample() {
  return (
    <div className="max-w-md">
      <ImageCropper>
        <ImageCropperViewport>
          <ImageCropperImage src={SAMPLE_IMAGE} alt="Live dimensions" />
          <ImageCropperSelection>
            {imageCropperHandles.map((position) => (
              <ImageCropperHandle key={position} position={position} />
            ))}
            <ImageCropperGrid axis="horizontal" />
            <ImageCropperGrid axis="vertical" />
            <ImageCropperDimensions />
          </ImageCropperSelection>
        </ImageCropperViewport>
      </ImageCropper>
    </div>
  )
}

function ConstrainToImageExample() {
  return (
    <div className="max-w-md space-y-2">
      <ImageCropper constrainToImage>
        <CropFrame alt="Constrained crop" />
      </ImageCropper>
      <p className="text-muted-foreground text-xs">
        Pan the image — the selection clamps to the visible image area instead
        of the bare viewport.
      </p>
    </div>
  )
}

function DropzoneExample() {
  const [src, setSrc] = useState<string | null>(null)
  return (
    <div className="max-w-md space-y-3">
      <ImageCropper>
        {src ? (
          <ImageCropperViewport>
            <ImageCropperImage src={src} alt="Uploaded image" />
            <ImageCropperSelection>
              {imageCropperHandles.map((position) => (
                <ImageCropperHandle key={position} position={position} />
              ))}
              <ImageCropperGrid axis="horizontal" />
              <ImageCropperGrid axis="vertical" />
            </ImageCropperSelection>
          </ImageCropperViewport>
        ) : (
          <ImageCropperDropzone
            onFileAccept={(d) => setSrc(d.dataUrl)}
            maxSize={10 * 1024 * 1024}
            className="aspect-square"
          />
        )}
      </ImageCropper>
      {src && (
        <Button variant="outline" size="sm" onClick={() => setSrc(null)}>
          Clear
        </Button>
      )}
    </div>
  )
}

function TranslationsExample() {
  return (
    <div className="max-w-md">
      <ImageCropper
        translations={{
          selectionLabel: "Région de recadrage",
          handleLabel: (position) => `Redimensionner depuis ${position}`,
          dropzoneLabel: "Déposez une image ici",
          dropzoneActiveLabel: "Relâchez pour charger",
        }}
      >
        <CropFrame alt="French ARIA" />
      </ImageCropper>
    </div>
  )
}

function ImageCropperPage() {
  return (
    <ShowcasePage
      title="Image Cropper"
      description="A compound primitive for cropping and orienting an image. Drag the selection to move, drag the eight handles to resize, drag the bare viewport to pan, wheel or pinch to zoom, arrow keys to nudge."
    >
      <ShowcaseExample title="Basic" code={BASIC_CODE}>
        <BasicExample />
      </ShowcaseExample>

      <ShowcaseExample title="Drag-and-drop file" code={DROPZONE_CODE}>
        <DropzoneExample />
      </ShowcaseExample>

      <ShowcaseExample title="Live dimensions badge" code={DIMENSIONS_CODE}>
        <DimensionsBadgeExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Constrain selection to image"
        code={CONSTRAIN_CODE}
      >
        <ConstrainToImageExample />
      </ShowcaseExample>

      <ShowcaseExample title="Translations (French)" code={TRANSLATIONS_CODE}>
        <TranslationsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Aspect ratio" code={ASPECT_RATIO_CODE}>
        <AspectRatioExample />
      </ShowcaseExample>

      <ShowcaseExample title="Circle" code={CIRCLE_CODE}>
        <CircleExample />
      </ShowcaseExample>

      <ShowcaseExample title="Initial crop" code={INITIAL_CROP_CODE}>
        <InitialCropExample />
      </ShowcaseExample>

      <ShowcaseExample title="Min / max selection size" code={MIN_MAX_CODE}>
        <MinMaxSizeExample />
      </ShowcaseExample>

      <ShowcaseExample title="Fixed crop area" code={FIXED_CODE}>
        <FixedExample />
      </ShowcaseExample>

      <ShowcaseExample title="Controlled zoom" code={CONTROLLED_ZOOM_CODE}>
        <ControlledZoomExample />
      </ShowcaseExample>

      <ShowcaseExample title="Zoom limits" code={ZOOM_LIMITS_CODE}>
        <ZoomLimitsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Rotation" code={ROTATION_CODE}>
        <RotationExample />
      </ShowcaseExample>

      <ShowcaseExample title="Flip" code={FLIP_CODE}>
        <FlipExample />
      </ShowcaseExample>

      <ShowcaseExample title="Events" code={EVENTS_CODE}>
        <EventsExample />
      </ShowcaseExample>

      <ShowcaseExample title="Context (render-prop)" code={CONTEXT_CODE}>
        <ContextExample />
      </ShowcaseExample>

      <ShowcaseExample title="Root provider" code={ROOT_PROVIDER_CODE}>
        <RootProviderExample />
      </ShowcaseExample>

      <ShowcaseExample title="Crop preview" code={CROP_PREVIEW_CODE}>
        <CropPreviewExample />
      </ShowcaseExample>

      <ShowcaseExample title="Reset" code={RESET_CODE}>
        <ResetExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

const BASIC_CODE = `<ImageCropper>
  <ImageCropperViewport>
    <ImageCropperImage src={SAMPLE_IMAGE} alt="Sample" />
    <ImageCropperSelection>
      {imageCropperHandles.map((position) => (
        <ImageCropperHandle key={position} position={position} />
      ))}
      <ImageCropperGrid axis="horizontal" />
      <ImageCropperGrid axis="vertical" />
    </ImageCropperSelection>
  </ImageCropperViewport>
</ImageCropper>`

const ASPECT_RATIO_CODE = `const [aspect, setAspect] = useState(16 / 9)

<ToggleGroup type="single" value={String(aspect)} onValueChange={(v) => v && setAspect(Number.parseFloat(v))}>
  <ToggleGroupItem value="1.7777">16:9</ToggleGroupItem>
  <ToggleGroupItem value="1">1:1</ToggleGroupItem>
  <ToggleGroupItem value="0.5625">9:16</ToggleGroupItem>
</ToggleGroup>

<ImageCropper aspectRatio={aspect}>
  ...
</ImageCropper>`

const CIRCLE_CODE = `<ImageCropper cropShape="circle" aspectRatio={1}>
  ...
</ImageCropper>`

const INITIAL_CROP_CODE = `<ImageCropper initialCrop={{ x: 80, y: 60, width: 240, height: 160 }}>
  ...
</ImageCropper>`

const MIN_MAX_CODE = `<ImageCropper minWidth={120} minHeight={120} maxWidth={260} maxHeight={260}>
  ...
</ImageCropper>`

const FIXED_CODE = `<ImageCropper fixedCropArea initialCrop={{ x: 40, y: 40, width: 200, height: 200 }}>
  ...
</ImageCropper>`

const CONTROLLED_ZOOM_CODE = `const [zoom, setZoom] = useState(1)

<Slider value={[zoom]} onValueChange={(v) => setZoom(v[0] ?? 1)} min={1} max={5} step={0.05} />

<ImageCropper zoom={zoom} onZoomChange={(d) => setZoom(d.zoom)}>
  ...
</ImageCropper>`

const ZOOM_LIMITS_CODE = `<ImageCropper zoom={zoom} onZoomChange={...} minZoom={1} maxZoom={3} zoomStep={0.05}>
  ...
</ImageCropper>`

const ROTATION_CODE = `const cropper = useImageCropper()

<Button onClick={() => cropper.rotateBy(-90)}>-90°</Button>
<Button onClick={() => cropper.rotateBy(90)}>+90°</Button>

<ImageCropperRootProvider value={cropper}>
  ...
</ImageCropperRootProvider>`

const FLIP_CODE = `const cropper = useImageCropper()

<Button onClick={() => cropper.flipHorizontal()}>Flip horizontal</Button>
<Button onClick={() => cropper.flipVertical()}>Flip vertical</Button>

<ImageCropperRootProvider value={cropper}>
  ...
</ImageCropperRootProvider>`

const EVENTS_CODE = `const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 })
const [zoom, setZoom] = useState(1)
const [rotation, setRotation] = useState(0)

<ImageCropper
  onCropChange={(d) => setCrop(d.crop)}
  onZoomChange={(d) => setZoom(d.zoom)}
  onRotationChange={(d) => setRotation(d.rotation)}
>
  ...
</ImageCropper>`

const CONTEXT_CODE = `<ImageCropper>
  ...
  <ImageCropperContext>
    {(api) => (
      <div>
        Selection — {Math.round(api.crop.x)}, {Math.round(api.crop.y)} ·{" "}
        {Math.round(api.crop.width)} × {Math.round(api.crop.height)}
      </div>
    )}
  </ImageCropperContext>
</ImageCropper>`

const ROOT_PROVIDER_CODE = `const cropper = useImageCropper({ aspectRatio: 4 / 3 })

<ImageCropperRootProvider value={cropper}>
  <ImageCropperViewport>...</ImageCropperViewport>
</ImageCropperRootProvider>`

const CROP_PREVIEW_CODE = `const cropper = useImageCropper()
const [preview, setPreview] = useState<string | null>(null)

const handleCrop = async () => {
  const url = await cropper.getCroppedImage({ output: "dataUrl" })
  if (typeof url === "string") setPreview(url)
}

<ImageCropperRootProvider value={cropper}>
  <ImageCropperViewport>...</ImageCropperViewport>
</ImageCropperRootProvider>
<Button onClick={handleCrop}>Crop image</Button>
{preview && <img src={preview} alt="Cropped preview" />}`

const RESET_CODE = `const initial = { x: 60, y: 60, width: 200, height: 200 }
const cropper = useImageCropper({ initialCrop: initial })

const handleReset = () => {
  cropper.setZoom(1)
  cropper.setRotation(0)
  cropper.setFlip({ horizontal: false, vertical: false })
  cropper.setImagePosition({ x: 0, y: 0 })
  cropper.setCrop(initial)
}

<Button onClick={handleReset}>Reset</Button>
<ImageCropperRootProvider value={cropper}>
  ...
</ImageCropperRootProvider>`

const DROPZONE_CODE = `const [src, setSrc] = useState<string | null>(null)

<ImageCropper>
  {src ? (
    <ImageCropperViewport>
      <ImageCropperImage src={src} alt="Uploaded" />
      <ImageCropperSelection>...</ImageCropperSelection>
    </ImageCropperViewport>
  ) : (
    <ImageCropperDropzone
      onFileAccept={(d) => setSrc(d.dataUrl)}
      maxSize={10 * 1024 * 1024}
    />
  )}
</ImageCropper>`

const DIMENSIONS_CODE = `<ImageCropper>
  <ImageCropperViewport>
    <ImageCropperImage src={SAMPLE_IMAGE} alt="Sample" />
    <ImageCropperSelection>
      {imageCropperHandles.map((position) => (
        <ImageCropperHandle key={position} position={position} />
      ))}
      <ImageCropperGrid axis="horizontal" />
      <ImageCropperGrid axis="vertical" />
      <ImageCropperDimensions />
    </ImageCropperSelection>
  </ImageCropperViewport>
</ImageCropper>`

const CONSTRAIN_CODE = `// Selection clamps to the visible image rectangle (factoring in zoom,
// pan, and rotation) instead of the bare viewport.
<ImageCropper constrainToImage>
  ...
</ImageCropper>`

const TRANSLATIONS_CODE = `<ImageCropper
  translations={{
    selectionLabel: "Région de recadrage",
    handleLabel: (position) => \`Redimensionner depuis \${position}\`,
    dropzoneLabel: "Déposez une image ici",
    dropzoneActiveLabel: "Relâchez pour charger",
  }}
>
  ...
</ImageCropper>`
