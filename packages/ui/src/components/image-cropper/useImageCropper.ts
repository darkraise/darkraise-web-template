import * as React from "react"
import { useControllableState } from "@primitives/state"
import {
  DEFAULT_TRANSLATIONS,
  type CropChangeDetails,
  type CropRect,
  type CropShape,
  type FlipChangeDetails,
  type FlipState,
  type GetCroppedImageOptions,
  type HandlePosition,
  type IntlTranslations,
  type RotationChangeDetails,
  type ZoomChangeDetails,
} from "./types"

export interface UseImageCropperOptions {
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (details: ZoomChangeDetails) => void

  rotation?: number
  defaultRotation?: number
  onRotationChange?: (details: RotationChangeDetails) => void

  flip?: FlipState
  defaultFlip?: FlipState
  onFlipChange?: (details: FlipChangeDetails) => void

  crop?: CropRect
  defaultCrop?: CropRect
  initialCrop?: CropRect
  onCropChange?: (details: CropChangeDetails) => void

  aspectRatio?: number
  cropShape?: CropShape
  fixedCropArea?: boolean

  /** When true, the selection clamps to the displayed image rectangle
   *  (taking object-contain, zoom, pan, and rotation into account) instead
   *  of the bare viewport. Off by default to preserve the looser viewport
   *  clamp consumers may be relying on. */
  constrainToImage?: boolean

  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number

  minZoom?: number
  maxZoom?: number
  zoomStep?: number
  zoomSensitivity?: number

  nudgeStep?: number
  nudgeStepShift?: number
  nudgeStepCtrl?: number

  /** Optional translations object for ARIA labels. Defaults to English. */
  translations?: Partial<IntlTranslations>

  id?: string
  ids?: Partial<{
    root: string
    viewport: string
    image: string
    selection: string
    handle: (position: HandlePosition) => string
  }>
}

const DEFAULT_FLIP: FlipState = { horizontal: false, vertical: false }
const DEFAULT_CROP: CropRect = { x: 0, y: 0, width: 0, height: 0 }

interface ViewportSize {
  width: number
  height: number
}

interface ImageNaturalSize {
  naturalWidth: number
  naturalHeight: number
}

export interface UseImageCropperReturn {
  zoom: number
  rotation: number
  flip: FlipState
  crop: CropRect

  imagePosition: { x: number; y: number }
  viewport: ViewportSize
  image: ImageNaturalSize
  imageReady: boolean

  cropShape: CropShape
  fixedCropArea: boolean
  aspectRatio: number | undefined
  constrainToImage: boolean

  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  minZoom: number
  maxZoom: number
  zoomStep: number
  zoomSensitivity: number
  nudgeStep: number
  nudgeStepShift: number
  nudgeStepCtrl: number

  /** True while a pointer drag (move / resize / pan / pinch) is in flight. */
  isDragging: boolean

  translations: IntlTranslations

  ids: {
    root: string
    viewport: string
    image: string
    selection: string
    handle: (position: HandlePosition) => string
  }

  setZoom: (next: number) => void
  setRotation: (next: number) => void
  setFlip: (next: FlipState) => void
  setCrop: (next: CropRect) => void

  rotateBy: (degrees: number) => void
  flipHorizontal: () => void
  flipVertical: () => void

  registerViewport: (size: ViewportSize) => void
  registerImage: (size: ImageNaturalSize) => void
  setImagePosition: (next: { x: number; y: number }) => void
  setDragging: (next: boolean) => void
  setOrientedSource: (bitmap: ImageBitmap | null) => void

  imageRef: React.RefObject<HTMLImageElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>

  /** Axis-aligned bounding box of the image as currently rendered in the
   *  viewport, factoring in object-contain, zoom, pan, and rotation. */
  getDisplayedImageBounds: () => CropRect

  getCroppedImage: (
    options?: GetCroppedImageOptions,
  ) => Promise<Blob | string | null>

  // Internal helpers exposed for the connect() layer; not part of the public
  // surface but needed by the compound components for clamping.
  clampZoom: (value: number) => number
  clampCrop: (rect: CropRect) => CropRect
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function applyAspectRatio(
  rect: CropRect,
  aspectRatio: number | undefined,
  viewport: ViewportSize,
): CropRect {
  if (!aspectRatio || aspectRatio <= 0) return rect
  // Honour the wider dimension first so the user's intent (typically the side
  // they were dragging) is preserved; the orthogonal side is recomputed.
  const widthFromHeight = rect.height * aspectRatio
  const heightFromWidth = rect.width / aspectRatio
  if (widthFromHeight <= viewport.width) {
    return { ...rect, width: widthFromHeight }
  }
  return { ...rect, height: heightFromWidth }
}

export function useImageCropper(
  options: UseImageCropperOptions = {},
): UseImageCropperReturn {
  const generatedId = React.useId()
  const id = options.id ?? generatedId

  const minZoom = options.minZoom ?? 1
  const maxZoom = options.maxZoom ?? 5
  const zoomStep = options.zoomStep ?? 0.1
  const zoomSensitivity = options.zoomSensitivity ?? 2
  const nudgeStep = options.nudgeStep ?? 1
  const nudgeStepShift = options.nudgeStepShift ?? 10
  const nudgeStepCtrl = options.nudgeStepCtrl ?? 50
  const minWidth = options.minWidth ?? 40
  const maxWidth = options.maxWidth ?? Number.POSITIVE_INFINITY
  const minHeight = options.minHeight ?? 40
  const maxHeight = options.maxHeight ?? Number.POSITIVE_INFINITY
  const cropShape: CropShape = options.cropShape ?? "rectangle"
  const fixedCropArea = options.fixedCropArea ?? false
  const aspectRatio = options.aspectRatio
  const constrainToImage = options.constrainToImage ?? false

  const translations = React.useMemo<IntlTranslations>(
    () => ({ ...DEFAULT_TRANSLATIONS, ...options.translations }),
    [options.translations],
  )

  const [zoom, setZoomState] = useControllableState<number>({
    value: options.zoom,
    defaultValue: options.defaultZoom ?? 1,
    onChange: (next) => options.onZoomChange?.({ zoom: next }),
  })
  const [rotation, setRotationState] = useControllableState<number>({
    value: options.rotation,
    defaultValue: options.defaultRotation ?? 0,
    onChange: (next) => options.onRotationChange?.({ rotation: next }),
  })
  const [flip, setFlipState] = useControllableState<FlipState>({
    value: options.flip,
    defaultValue: options.defaultFlip ?? DEFAULT_FLIP,
    onChange: (next) => options.onFlipChange?.({ flip: next }),
  })
  const [crop, setCropState] = useControllableState<CropRect>({
    value: options.crop,
    defaultValue: options.defaultCrop ?? options.initialCrop ?? DEFAULT_CROP,
    onChange: (next) => options.onCropChange?.({ crop: next }),
  })

  const [viewport, setViewport] = React.useState<ViewportSize>({
    width: 0,
    height: 0,
  })
  const [image, setImage] = React.useState<ImageNaturalSize>({
    naturalWidth: 0,
    naturalHeight: 0,
  })
  const [imagePosition, setImagePositionState] = React.useState({
    x: 0,
    y: 0,
  })
  const [isDragging, setDraggingState] = React.useState(false)

  const imageRef = React.useRef<HTMLImageElement | null>(null)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const orientedSourceRef = React.useRef<ImageBitmap | null>(null)

  const clampZoom = React.useCallback(
    (value: number): number => clamp(value, minZoom, maxZoom),
    [minZoom, maxZoom],
  )

  const getDisplayedImageBounds = React.useCallback((): CropRect => {
    if (
      viewport.width === 0 ||
      viewport.height === 0 ||
      image.naturalWidth === 0 ||
      image.naturalHeight === 0
    ) {
      return {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      }
    }
    const naturalRatio = image.naturalWidth / image.naturalHeight
    const viewportRatio = viewport.width / viewport.height
    let dw: number
    let dh: number
    if (naturalRatio > viewportRatio) {
      dw = viewport.width
      dh = viewport.width / naturalRatio
    } else {
      dh = viewport.height
      dw = viewport.height * naturalRatio
    }
    // Apply zoom and rotation to derive the axis-aligned bounding box of
    // the rendered image. The bbox grows with rotation because the corners
    // sweep outside the unrotated rect.
    const angle = (rotation * Math.PI) / 180
    const ew = dw * zoom
    const eh = dh * zoom
    const bw = Math.abs(ew * Math.cos(angle)) + Math.abs(eh * Math.sin(angle))
    const bh = Math.abs(ew * Math.sin(angle)) + Math.abs(eh * Math.cos(angle))
    const cx = viewport.width / 2 + imagePosition.x
    const cy = viewport.height / 2 + imagePosition.y
    return {
      x: cx - bw / 2,
      y: cy - bh / 2,
      width: bw,
      height: bh,
    }
  }, [viewport, image, zoom, rotation, imagePosition])

  const clampCrop = React.useCallback(
    (rect: CropRect): CropRect => {
      const v = viewport
      // Begin by clamping the size to its declared min/max, bounded by the
      // viewport so a tiny viewport doesn't allow an oversized rect.
      let width = clamp(
        rect.width,
        minWidth,
        Math.min(maxWidth, v.width || maxWidth),
      )
      let height = clamp(
        rect.height,
        minHeight,
        Math.min(maxHeight, v.height || maxHeight),
      )
      // Aspect ratio enforcement runs after size clamp so min/max already won.
      if (aspectRatio && aspectRatio > 0) {
        const heightFromWidth = width / aspectRatio
        if (heightFromWidth >= minHeight && heightFromWidth <= maxHeight) {
          height = heightFromWidth
        } else {
          width = height * aspectRatio
        }
      }
      // Bounds: viewport by default, intersected with the displayed image
      // when constrainToImage is enabled. The result is always clipped to
      // [0, viewport] so a panned-away image can't push the rect off-screen.
      let minX = 0
      let minY = 0
      let maxBoundX = v.width || width
      let maxBoundY = v.height || height
      if (constrainToImage) {
        const img = getDisplayedImageBounds()
        minX = Math.max(minX, img.x)
        minY = Math.max(minY, img.y)
        maxBoundX = Math.min(maxBoundX, img.x + img.width)
        maxBoundY = Math.min(maxBoundY, img.y + img.height)
      }
      // If constraints leave no room, fall back to the viewport so the rect
      // doesn't collapse to zero on a freshly-loaded image with extreme pan.
      if (maxBoundX - minX < width) {
        minX = 0
        maxBoundX = v.width || width
      }
      if (maxBoundY - minY < height) {
        minY = 0
        maxBoundY = v.height || height
      }
      const maxX = Math.max(minX, maxBoundX - width)
      const maxY = Math.max(minY, maxBoundY - height)
      const x = clamp(rect.x, minX, maxX)
      const y = clamp(rect.y, minY, maxY)
      return { x, y, width, height }
    },
    [
      viewport,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      aspectRatio,
      constrainToImage,
      getDisplayedImageBounds,
    ],
  )

  const setZoom = React.useCallback(
    (next: number) => setZoomState(clampZoom(next)),
    [clampZoom, setZoomState],
  )

  const setRotation = React.useCallback(
    (next: number) => {
      // Wrap into [0, 360) so callers passing 720 or -45 still produce a sane
      // visual rotation; matches Ark UI semantics.
      const wrapped = ((next % 360) + 360) % 360
      setRotationState(wrapped)
    },
    [setRotationState],
  )

  const setFlip = React.useCallback(
    (next: FlipState) => setFlipState(next),
    [setFlipState],
  )

  const setCrop = React.useCallback(
    (next: CropRect) => {
      if (fixedCropArea) return
      setCropState(clampCrop(next))
    },
    [fixedCropArea, clampCrop, setCropState],
  )

  const rotateBy = React.useCallback(
    (degrees: number) => setRotation(rotation + degrees),
    [rotation, setRotation],
  )

  const flipHorizontal = React.useCallback(
    () => setFlip({ ...flip, horizontal: !flip.horizontal }),
    [flip, setFlip],
  )

  const flipVertical = React.useCallback(
    () => setFlip({ ...flip, vertical: !flip.vertical }),
    [flip, setFlip],
  )

  const registerViewport = React.useCallback((size: ViewportSize) => {
    setViewport((prev) =>
      prev.width === size.width && prev.height === size.height ? prev : size,
    )
  }, [])

  const registerImage = React.useCallback((size: ImageNaturalSize) => {
    setImage((prev) =>
      prev.naturalWidth === size.naturalWidth &&
      prev.naturalHeight === size.naturalHeight
        ? prev
        : size,
    )
  }, [])

  const setDragging = React.useCallback(
    (next: boolean) => setDraggingState(next),
    [],
  )

  const setOrientedSource = React.useCallback((next: ImageBitmap | null) => {
    orientedSourceRef.current = next
  }, [])

  const setImagePosition = React.useCallback(
    (next: { x: number; y: number }) => setImagePositionState(next),
    [],
  )

  // Smart-default crop: once the viewport size is known and the crop is still
  // the empty default, seed it to a centred 80% rectangle honouring
  // aspectRatio. This runs only when the consumer hasn't supplied one.
  const seededRef = React.useRef(false)
  React.useEffect(() => {
    if (seededRef.current) return
    if (options.crop) return
    if (options.defaultCrop || options.initialCrop) return
    if (viewport.width === 0 || viewport.height === 0) return
    if (crop.width !== 0 || crop.height !== 0) {
      seededRef.current = true
      return
    }
    const ratio = aspectRatio ?? viewport.width / viewport.height
    let w = viewport.width * 0.8
    let h = w / ratio
    if (h > viewport.height * 0.8) {
      h = viewport.height * 0.8
      w = h * ratio
    }
    const x = (viewport.width - w) / 2
    const y = (viewport.height - h) / 2
    seededRef.current = true
    setCropState(
      applyAspectRatio({ x, y, width: w, height: h }, aspectRatio, viewport),
    )
  }, [
    viewport,
    aspectRatio,
    crop.width,
    crop.height,
    options.crop,
    options.defaultCrop,
    options.initialCrop,
    setCropState,
  ])

  // Re-aspect on aspectRatio change: keep the user's selection center but
  // resize to fit the new ratio. Without this the rect retains its old
  // proportions until the user drags a handle.
  const prevAspectRef = React.useRef<number | undefined>(aspectRatio)
  React.useEffect(() => {
    if (prevAspectRef.current === aspectRatio) return
    prevAspectRef.current = aspectRatio
    if (viewport.width === 0 || viewport.height === 0) return
    if (crop.width === 0 || crop.height === 0) return
    if (options.fixedCropArea) return
    const ratio = aspectRatio ?? viewport.width / viewport.height
    const cx = crop.x + crop.width / 2
    const cy = crop.y + crop.height / 2
    // Preserve the previous footprint as the upper bound and let the new
    // ratio fit inside it; cap by the viewport so a wide ratio doesn't
    // overflow.
    let w = Math.min(crop.width, viewport.width)
    let h = w / ratio
    if (h > viewport.height || h > crop.height) {
      h = Math.min(crop.height, viewport.height)
      w = h * ratio
    }
    if (w > viewport.width) {
      w = viewport.width
      h = w / ratio
    }
    setCropState({
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
    })
  }, [aspectRatio, viewport, crop, options.fixedCropArea, setCropState])

  const ids = React.useMemo(
    () => ({
      root: options.ids?.root ?? `image-cropper-${id}`,
      viewport: options.ids?.viewport ?? `image-cropper-${id}-viewport`,
      image: options.ids?.image ?? `image-cropper-${id}-image`,
      selection: options.ids?.selection ?? `image-cropper-${id}-selection`,
      handle:
        options.ids?.handle ??
        ((position: HandlePosition) =>
          `image-cropper-${id}-handle-${position}`),
    }),
    [id, options.ids],
  )

  const imageReady = image.naturalWidth > 0 && image.naturalHeight > 0

  const getCroppedImage = React.useCallback(
    async (
      options: GetCroppedImageOptions = {},
    ): Promise<Blob | string | null> => {
      const img = imageRef.current
      if (!img) return null
      if (viewport.width === 0 || viewport.height === 0) return null
      if (image.naturalWidth === 0 || image.naturalHeight === 0) return null
      if (crop.width === 0 || crop.height === 0) return null

      // The image renders with object-fit: contain, so its visible area is
      // smaller than the viewport whenever the natural aspect differs.
      const naturalRatio = image.naturalWidth / image.naturalHeight
      const viewportRatio = viewport.width / viewport.height
      let displayedW: number
      let displayedH: number
      if (naturalRatio > viewportRatio) {
        displayedW = viewport.width
        displayedH = viewport.width / naturalRatio
      } else {
        displayedH = viewport.height
        displayedW = viewport.height * naturalRatio
      }

      // Step 1: replay the CSS transform pipeline onto a viewport-sized
      // canvas. translate-origin is the viewport center because that's where
      // CSS transform-origin lands when the image is centered via
      // object-contain + inset-0 + m-auto + h-full + w-full.
      const stage = document.createElement("canvas")
      stage.width = viewport.width
      stage.height = viewport.height
      const stageCtx = stage.getContext("2d")
      if (!stageCtx) return null
      stageCtx.save()
      // The CSS filter() string is applied per-canvas-state; setting it
      // before transforms means it composites onto every drawImage in this
      // save/restore window. Editors layer brightness / contrast / etc.
      // through this hook instead of duplicating the pipeline.
      if (options.filter && options.filter !== "none") {
        stageCtx.filter = options.filter
      }
      stageCtx.translate(
        viewport.width / 2 + imagePosition.x,
        viewport.height / 2 + imagePosition.y,
      )
      stageCtx.rotate((rotation * Math.PI) / 180)
      const flipX = flip.horizontal ? -1 : 1
      const flipY = flip.vertical ? -1 : 1
      stageCtx.scale(zoom * flipX, zoom * flipY)
      // Prefer the EXIF-oriented ImageBitmap when available — drawImage on a
      // raw HTMLImageElement ignores EXIF orientation in canvas, so phone
      // photos render sideways without this swap.
      const source: CanvasImageSource = orientedSourceRef.current ?? img
      stageCtx.drawImage(
        source,
        -displayedW / 2,
        -displayedH / 2,
        displayedW,
        displayedH,
      )
      stageCtx.restore()

      // Composers (e.g. ImageEditor) layer overlays in unrotated viewport
      // space here — after the image transform has been undone but before
      // the selection is cropped out. Filter is also cleared at this point
      // so overlays render at their literal colors.
      options.postDraw?.(stageCtx, {
        width: viewport.width,
        height: viewport.height,
      })

      // Step 2: cut the selected rect out of the staged canvas, optionally
      // resampling to the user-supplied output size. circle shape is a
      // clipped arc on the destination canvas before drawImage runs.
      const outW = options.width ?? crop.width
      const outH = options.height ?? crop.height
      if (outW <= 0 || outH <= 0) return null
      const out = document.createElement("canvas")
      out.width = outW
      out.height = outH
      const outCtx = out.getContext("2d")
      if (!outCtx) return null
      if (cropShape === "circle") {
        outCtx.beginPath()
        outCtx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
        outCtx.clip()
      }
      outCtx.drawImage(
        stage,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outW,
        outH,
      )

      const type = options.type ?? "image/png"
      const output = options.output ?? "blob"
      if (output === "dataUrl") {
        return out.toDataURL(type, options.quality)
      }
      return await new Promise<Blob | null>((resolve) => {
        out.toBlob((blob) => resolve(blob), type, options.quality)
      })
    },
    [
      crop,
      cropShape,
      flip,
      image,
      imagePosition,
      imageRef,
      rotation,
      viewport,
      zoom,
    ],
  )

  return {
    zoom,
    rotation,
    flip,
    crop,
    imagePosition,
    viewport,
    image,
    imageReady,
    cropShape,
    fixedCropArea,
    aspectRatio,
    constrainToImage,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    minZoom,
    maxZoom,
    zoomStep,
    zoomSensitivity,
    nudgeStep,
    nudgeStepShift,
    nudgeStepCtrl,
    isDragging,
    translations,
    ids,
    setZoom,
    setRotation,
    setFlip,
    setCrop,
    rotateBy,
    flipHorizontal,
    flipVertical,
    registerViewport,
    registerImage,
    setImagePosition,
    setDragging,
    setOrientedSource,
    imageRef,
    viewportRef,
    getDisplayedImageBounds,
    getCroppedImage,
    clampZoom,
    clampCrop,
  }
}
