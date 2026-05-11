export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface FlipState {
  horizontal: boolean
  vertical: boolean
}

export type CropShape = "rectangle" | "circle"

export type HandlePosition =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"

export type GridAxis = "horizontal" | "vertical"

export interface CropChangeDetails {
  crop: CropRect
}

export interface ZoomChangeDetails {
  zoom: number
}

export interface RotationChangeDetails {
  rotation: number
}

export interface FlipChangeDetails {
  flip: FlipState
}

export type CropOutput = "blob" | "dataUrl"

export interface GetCroppedImageOptions {
  output?: CropOutput
  type?: string
  quality?: number
  width?: number
  height?: number
  /** Optional CSS filter() string applied to the staging canvas before
   *  drawImage runs. Lets composers (e.g. ImageEditor) bake adjust filters
   *  into the rasterized output without duplicating the canvas pipeline. */
  filter?: string
  /** Optional hook that runs after the image is drawn to the staging
   *  canvas but before the final crop step. Composers use this to layer
   *  annotations / overlays onto the output in viewport coordinates. The
   *  ctx is already in unrotated viewport space (the image-transform
   *  save/restore has finished). */
  postDraw?: (
    ctx: CanvasRenderingContext2D,
    viewport: { width: number; height: number },
  ) => void
}

export const imageCropperHandles: HandlePosition[] = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left",
]

export interface IntlTranslations {
  selectionLabel: string
  handleLabel: (position: HandlePosition) => string
  dropzoneLabel: string
  dropzoneActiveLabel: string
}

export const DEFAULT_TRANSLATIONS: IntlTranslations = {
  selectionLabel: "Crop selection",
  handleLabel: (position) => `Resize ${position}`,
  dropzoneLabel: "Drop an image here, or click to browse",
  dropzoneActiveLabel: "Release to load image",
}

// FileAcceptDetails / FileRejectDetails moved to image-common; re-exported
// here so existing cropper consumers keep importing them from the cropper
// module without changes.
export type {
  FileAcceptDetails,
  FileRejectDetails,
} from "@components/image-common"
