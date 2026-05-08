import { useControllableState } from "@primitives/state"

export interface UseImageCropperOptions {
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  rotation?: number
  defaultRotation?: number
  onRotationChange?: (rotation: number) => void
  minZoom?: number
  maxZoom?: number
}

export function useImageCropper(options: UseImageCropperOptions) {
  const [zoom, setZoom] = useControllableState<number>({
    value: options.zoom,
    defaultValue: options.defaultZoom ?? 1,
    onChange: options.onZoomChange,
  })
  const [rotation, setRotation] = useControllableState<number>({
    value: options.rotation,
    defaultValue: options.defaultRotation ?? 0,
    onChange: options.onRotationChange,
  })

  const minZoom = options.minZoom ?? 0.5
  const maxZoom = options.maxZoom ?? 4

  const clampZoom = (z: number) => Math.min(maxZoom, Math.max(minZoom, z))

  const setZoomClamped = (z: number) => setZoom(clampZoom(z))
  const rotate90 = () => setRotation((rotation + 90) % 360)

  return { zoom, setZoom: setZoomClamped, rotation, setRotation, rotate90 }
}
