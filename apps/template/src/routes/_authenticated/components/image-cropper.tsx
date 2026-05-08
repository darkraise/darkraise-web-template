import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ImageCropper } from "darkraise-ui/components/image-cropper"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/image-cropper",
)({
  component: ImageCropperPage,
})

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"

function ImageCropperPage() {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  return (
    <ShowcasePage
      title="Image Cropper"
      description="A primitive for cropping and orienting an image. Zoom and rotation are controllable, and an imperative ref can export the result as a Blob."
    >
      <ShowcaseExample
        title="Default"
        code={`<ImageCropper
  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80"
  alt="Sample landscape"
/>`}
      >
        <div className="max-w-md">
          <ImageCropper src={SAMPLE_IMAGE} alt="Sample landscape" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Controlled zoom + rotation"
        code={`const [zoom, setZoom] = useState(1)
const [rotation, setRotation] = useState(0)

<ImageCropper
  src={SAMPLE_IMAGE}
  alt="Sample landscape"
  zoom={zoom}
  onZoomChange={setZoom}
  rotation={rotation}
  onRotationChange={setRotation}
/>

<p>Zoom: {zoom.toFixed(2)} · Rotation: {rotation}°</p>`}
      >
        <div className="space-y-3">
          <div className="max-w-md">
            <ImageCropper
              src={SAMPLE_IMAGE}
              alt="Sample landscape"
              zoom={zoom}
              onZoomChange={setZoom}
              rotation={rotation}
              onRotationChange={setRotation}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Zoom: {zoom.toFixed(2)} · Rotation: {rotation}°
          </p>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
