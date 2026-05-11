import type { CropRect, FlipState } from "@components/image-cropper"

// ── Filters ─────────────────────────────────────────────────────────────────
//
// Each filter is a number tuned so that the neutral identity matches the
// CSS filter-function neutral: brightness/contrast/saturation default to 1,
// hue-rotate to 0deg, blur to 0px, grayscale/sepia to 0. Sliders should clamp
// to the documented ranges.

export interface FilterState {
  brightness: number
  contrast: number
  saturation: number
  hueRotate: number
  blur: number
  grayscale: number
  sepia: number
}

export const NEUTRAL_FILTERS: FilterState = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
}

export interface FilterRange {
  min: number
  max: number
  step: number
}

export const FILTER_RANGES: Record<keyof FilterState, FilterRange> = {
  brightness: { min: 0, max: 2, step: 0.01 },
  contrast: { min: 0, max: 2, step: 0.01 },
  saturation: { min: 0, max: 2, step: 0.01 },
  hueRotate: { min: 0, max: 360, step: 1 },
  blur: { min: 0, max: 20, step: 0.1 },
  grayscale: { min: 0, max: 1, step: 0.01 },
  sepia: { min: 0, max: 1, step: 0.01 },
}

// ── Tools ───────────────────────────────────────────────────────────────────

export type EditorTool =
  | "crop"
  | "adjust"
  | "annotate"
  | "freeform"
  | "perspective"

// ── Annotations ─────────────────────────────────────────────────────────────

export type AnnotationKind =
  | "pen"
  | "highlighter"
  | "arrow"
  | "rectangle"
  | "circle"
  | "text"

export interface Point {
  x: number
  y: number
}

export interface AnnotationStroke {
  id: string
  kind: AnnotationKind
  points: Point[]
  color: string
  width: number
  opacity: number
  /** Rendered text for kind === "text"; ignored otherwise. */
  text?: string
}

// ── Freeform selection ─────────────────────────────────────────────────────

export interface FreeformPath {
  /** Closed polygonal path in viewport coordinates. The mask treats the
   *  last → first segment as implicit. */
  points: Point[]
}

// ── Perspective correction ─────────────────────────────────────────────────

export interface PerspectiveCorners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface FilterPreset {
  id: string
  label: string
  /** Partial overrides applied on top of NEUTRAL_FILTERS. Undefined keys
   *  retain the neutral identity. */
  filters: Partial<FilterState>
}

export const DEFAULT_PRESETS: FilterPreset[] = [
  { id: "none", label: "Original", filters: {} },
  {
    id: "vivid",
    label: "Vivid",
    filters: { saturation: 1.4, contrast: 1.1 },
  },
  {
    id: "muted",
    label: "Muted",
    filters: { saturation: 0.7, brightness: 1.05 },
  },
  { id: "bw", label: "B&W", filters: { grayscale: 1 } },
  { id: "sepia", label: "Sepia", filters: { sepia: 1 } },
  {
    id: "vintage",
    label: "Vintage",
    filters: { sepia: 0.4, contrast: 1.15, saturation: 0.8 },
  },
]

// ── Change events ──────────────────────────────────────────────────────────

export interface FiltersChangeDetails {
  filters: FilterState
}
export interface ToolChangeDetails {
  tool: EditorTool
}
export interface AnnotationsChangeDetails {
  annotations: AnnotationStroke[]
}
export interface FreeformPathChangeDetails {
  freeformPath: FreeformPath | null
}
export interface PerspectiveChangeDetails {
  perspective: PerspectiveCorners | null
}

// ── History ─────────────────────────────────────────────────────────────────
//
// EditorSnapshot is the union of every undoable piece of state — both the
// editor-only fields and the wrapped cropper's geometric state. Re-applying
// a snapshot fully restores a prior moment.

export interface EditorSnapshot {
  filters: FilterState
  annotations: AnnotationStroke[]
  freeformPath: FreeformPath | null
  perspective: PerspectiveCorners | null
  crop: CropRect
  zoom: number
  rotation: number
  flip: FlipState
  imagePosition: Point
}

// ── Extensions ──────────────────────────────────────────────────────────────

export interface ExtensionInput {
  image: ImageBitmap | HTMLImageElement
  filters: FilterState
  crop: CropRect
  freeformPath: FreeformPath | null
}

export interface ExtensionOutput {
  /** Optional replacement bitmap. When provided, the editor swaps it into
   *  the canvas pipeline as the source for subsequent operations. */
  image?: ImageBitmap
  /** Optional freeform path output. Useful for content-aware selection
   *  extensions like a magic wand. */
  mask?: FreeformPath
}

export type ExtensionHandler = (
  input: ExtensionInput,
) => Promise<ExtensionOutput>
