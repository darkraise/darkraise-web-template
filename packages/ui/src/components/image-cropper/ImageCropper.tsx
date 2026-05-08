import * as React from "react"
import { RotateCcw, ZoomIn } from "lucide-react"
import { cn } from "@lib/utils"
import { useImageCropper, type UseImageCropperOptions } from "./useImageCropper"
import "./image-cropper.css"

export interface ImageCropperHandle {
  exportAsBlob: (options?: {
    width?: number
    height?: number
    type?: string
    quality?: number
  }) => Promise<Blob | null>
}

export interface ImageCropperProps
  extends
    UseImageCropperOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof UseImageCropperOptions> {
  src: string
  alt: string
  ref?: React.Ref<ImageCropperHandle>
}

function ImageCropper({
  src,
  alt,
  className,
  zoom,
  defaultZoom,
  onZoomChange,
  rotation,
  defaultRotation,
  onRotationChange,
  minZoom,
  maxZoom,
  ref,
  ...rest
}: ImageCropperProps) {
  const machine = useImageCropper({
    zoom,
    defaultZoom,
    onZoomChange,
    rotation,
    defaultRotation,
    onRotationChange,
    minZoom,
    maxZoom,
  })
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  React.useImperativeHandle(
    ref,
    () => ({
      exportAsBlob: ({
        width = 300,
        height = 300,
        type = "image/png",
        quality,
      } = {}) =>
        new Promise<Blob | null>((resolve) => {
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          const img = imgRef.current
          if (!ctx || !img) {
            resolve(null)
            return
          }
          ctx.save()
          ctx.translate(width / 2, height / 2)
          ctx.rotate((machine.rotation * Math.PI) / 180)
          ctx.scale(machine.zoom, machine.zoom)
          ctx.drawImage(img, -width / 2, -height / 2, width, height)
          ctx.restore()
          canvas.toBlob((blob) => resolve(blob), type, quality)
        }),
    }),
    [machine.rotation, machine.zoom],
  )

  return (
    <div className={cn("dr-image-cropper", className)} {...rest}>
      <div className="dr-image-cropper-stage">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="dr-image-cropper-image"
          style={{
            transform: `rotate(${machine.rotation}deg) scale(${machine.zoom})`,
          }}
        />
      </div>
      <div className="dr-image-cropper-controls">
        <label className="dr-image-cropper-zoom">
          <ZoomIn className="h-4 w-4" aria-hidden />
          <span className="sr-only">Zoom</span>
          <input
            type="range"
            aria-label="Zoom"
            min={minZoom ?? 0.5}
            max={maxZoom ?? 4}
            step={0.1}
            value={machine.zoom}
            onChange={(event) =>
              machine.setZoom(Number.parseFloat(event.target.value))
            }
          />
        </label>
        <button
          type="button"
          aria-label="Rotate"
          onClick={machine.rotate90}
          className="dr-image-cropper-rotate"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export { ImageCropper }
