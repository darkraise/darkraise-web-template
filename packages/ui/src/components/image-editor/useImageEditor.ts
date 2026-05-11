import * as React from "react"
import { useControllableState } from "@primitives/state"
import {
  useImageCropper,
  type GetCroppedImageOptions,
  type UseImageCropperOptions,
  type UseImageCropperReturn,
} from "@components/image-cropper"
import { drawStroke } from "./annotationDraw"
import { drawPerspectiveQuad } from "./perspectiveDraw"
import {
  DEFAULT_PRESETS,
  NEUTRAL_FILTERS,
  type AnnotationKind,
  type AnnotationStroke,
  type AnnotationsChangeDetails,
  type EditorSnapshot,
  type EditorTool,
  type ExtensionHandler,
  type ExtensionInput,
  type ExtensionOutput,
  type FilterPreset,
  type FilterState,
  type FiltersChangeDetails,
  type FreeformPath,
  type FreeformPathChangeDetails,
  type PerspectiveChangeDetails,
  type PerspectiveCorners,
  type Point,
  type ToolChangeDetails,
} from "./types"

export interface UseImageEditorOptions extends UseImageCropperOptions {
  filters?: FilterState
  defaultFilters?: FilterState
  onFiltersChange?: (details: FiltersChangeDetails) => void

  tool?: EditorTool
  defaultTool?: EditorTool
  onToolChange?: (details: ToolChangeDetails) => void

  annotations?: AnnotationStroke[]
  defaultAnnotations?: AnnotationStroke[]
  onAnnotationsChange?: (details: AnnotationsChangeDetails) => void

  freeformPath?: FreeformPath | null
  defaultFreeformPath?: FreeformPath | null
  onFreeformPathChange?: (details: FreeformPathChangeDetails) => void

  perspective?: PerspectiveCorners | null
  defaultPerspective?: PerspectiveCorners | null
  onPerspectiveChange?: (details: PerspectiveChangeDetails) => void

  /** Replace the default preset list. */
  presets?: FilterPreset[]
  /** Append additional presets after the defaults; ignored if `presets`
   *  is supplied. */
  additionalPresets?: FilterPreset[]

  /** Maximum number of history snapshots retained. Default 50. */
  historyLimit?: number

  /** Extensions registered up-front. May also be added later via
   *  registerExtension. */
  extensions?: Record<string, ExtensionHandler>

  /** Initial draw configuration for annotations. Each kind has sensible
   *  defaults; consumers can override any subset. */
  defaultAnnotationKind?: AnnotationKind
  defaultAnnotationColor?: string
  defaultAnnotationWidth?: number
}

export interface UseImageEditorReturn {
  /** The composed cropper API. Geometric state and methods (crop, zoom,
   *  rotation, flip, imagePosition + their setters) live here. */
  cropper: UseImageCropperReturn

  filters: FilterState
  tool: EditorTool
  annotations: AnnotationStroke[]
  freeformPath: FreeformPath | null
  perspective: PerspectiveCorners | null

  presets: FilterPreset[]

  setFilters: (next: FilterState) => void
  setFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void
  resetFilters: () => void
  applyPreset: (preset: FilterPreset | string) => void

  setTool: (next: EditorTool) => void

  /** MIME type of the loaded image (e.g. "image/png", "image/jpeg") or
   *  null if not yet known. Set by ImageEditorImage from the src. */
  mimeType: string | null
  setMimeType: (next: string | null) => void

  /** Active annotation draw configuration applied to the next stroke. */
  activeAnnotationKind: AnnotationKind
  activeAnnotationColor: string
  activeAnnotationWidth: number
  /** Opacity is derived from the active kind (highlighter is translucent;
   *  pen / arrow are opaque). Exposed read-only here so consumers building
   *  custom toolbars can mirror the visual. */
  activeAnnotationOpacity: number
  setActiveAnnotationKind: (kind: AnnotationKind) => void
  setActiveAnnotationColor: (color: string) => void
  setActiveAnnotationWidth: (width: number) => void

  addAnnotation: (stroke: AnnotationStroke) => void
  updateAnnotation: (id: string, patch: Partial<AnnotationStroke>) => void
  removeAnnotation: (id: string) => void
  clearAnnotations: () => void

  setFreeformPath: (next: FreeformPath | null) => void
  clearFreeformPath: () => void

  setPerspective: (next: PerspectiveCorners | null) => void
  resetPerspective: () => void

  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  /** CSS filter() string derived from `filters`. "none" when neutral so it
   *  doesn't waste a layer on the GPU. */
  filterCss: string

  registerExtension: (name: string, handler: ExtensionHandler) => void
  unregisterExtension: (name: string) => void
  hasExtension: (name: string) => boolean
  runExtension: (name: string) => Promise<ExtensionOutput | null>

  /** Output the cropped + transformed + filtered + annotated image. The
   *  full canvas pipeline lands in phase 2; this placeholder returns null
   *  so callers wired up early degrade gracefully. */
  getEditedImage: (
    options?: GetCroppedImageOptions,
  ) => Promise<Blob | string | null>
}

const CROPPER_OPTION_KEYS: Array<keyof UseImageCropperOptions> = [
  "zoom",
  "defaultZoom",
  "onZoomChange",
  "rotation",
  "defaultRotation",
  "onRotationChange",
  "flip",
  "defaultFlip",
  "onFlipChange",
  "crop",
  "defaultCrop",
  "initialCrop",
  "onCropChange",
  "aspectRatio",
  "cropShape",
  "fixedCropArea",
  "constrainToImage",
  "minWidth",
  "maxWidth",
  "minHeight",
  "maxHeight",
  "minZoom",
  "maxZoom",
  "zoomStep",
  "zoomSensitivity",
  "nudgeStep",
  "nudgeStepShift",
  "nudgeStepCtrl",
  "translations",
  "id",
  "ids",
]

function pickCropperOptions(
  options: UseImageEditorOptions,
): UseImageCropperOptions {
  const out: Record<string, unknown> = {}
  for (const key of CROPPER_OPTION_KEYS) {
    if (options[key] !== undefined) {
      out[key] = options[key] as unknown
    }
  }
  return out as UseImageCropperOptions
}

function buildFilterCss(filters: FilterState): string {
  const parts: string[] = []
  if (filters.brightness !== 1) parts.push(`brightness(${filters.brightness})`)
  if (filters.contrast !== 1) parts.push(`contrast(${filters.contrast})`)
  if (filters.saturation !== 1) parts.push(`saturate(${filters.saturation})`)
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`)
  if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`)
  if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale})`)
  if (filters.sepia !== 0) parts.push(`sepia(${filters.sepia})`)
  return parts.length > 0 ? parts.join(" ") : "none"
}

function mergePreset(preset: FilterPreset): FilterState {
  return { ...NEUTRAL_FILTERS, ...preset.filters }
}

export function useImageEditor(
  options: UseImageEditorOptions = {},
): UseImageEditorReturn {
  const cropper = useImageCropper(pickCropperOptions(options))

  const [filters, setFiltersState] = useControllableState<FilterState>({
    value: options.filters,
    defaultValue: options.defaultFilters ?? NEUTRAL_FILTERS,
    onChange: (next) => options.onFiltersChange?.({ filters: next }),
  })
  const [tool, setToolState] = useControllableState<EditorTool>({
    value: options.tool,
    defaultValue: options.defaultTool ?? "crop",
    onChange: (next) => options.onToolChange?.({ tool: next }),
  })
  const [annotations, setAnnotationsState] = useControllableState<
    AnnotationStroke[]
  >({
    value: options.annotations,
    defaultValue: options.defaultAnnotations ?? [],
    onChange: (next) => options.onAnnotationsChange?.({ annotations: next }),
  })
  const [freeformPath, setFreeformPathState] =
    useControllableState<FreeformPath | null>({
      value: options.freeformPath,
      defaultValue: options.defaultFreeformPath ?? null,
      onChange: (next) =>
        options.onFreeformPathChange?.({ freeformPath: next }),
    })
  const [perspective, setPerspectiveState] =
    useControllableState<PerspectiveCorners | null>({
      value: options.perspective,
      defaultValue: options.defaultPerspective ?? null,
      onChange: (next) => options.onPerspectiveChange?.({ perspective: next }),
    })

  const historyLimit = options.historyLimit ?? 50

  const [activeAnnotationKind, setActiveAnnotationKindState] =
    React.useState<AnnotationKind>(options.defaultAnnotationKind ?? "pen")
  const [activeAnnotationColor, setActiveAnnotationColorState] =
    React.useState<string>(options.defaultAnnotationColor ?? "#ef4444")
  const [activeAnnotationWidth, setActiveAnnotationWidthState] =
    React.useState<number>(options.defaultAnnotationWidth ?? 4)

  // MIME type of the loaded image. Populated by ImageEditorImage from the
  // src (data URL prefix or file extension). Surfaced through the
  // returned API for the status bar and consumer code; null until the
  // image is identified or when the type can't be derived from src.
  const [mimeType, setMimeTypeState] = React.useState<string | null>(null)

  // Derived: highlighter is translucent so it reads as a marker; pen and
  // arrow are fully opaque. Text follows pen since it's a solid label.
  const activeAnnotationOpacity =
    activeAnnotationKind === "highlighter" ? 0.4 : 1

  const setActiveAnnotationKind = React.useCallback(
    (kind: AnnotationKind) => setActiveAnnotationKindState(kind),
    [],
  )
  const setActiveAnnotationColor = React.useCallback(
    (color: string) => setActiveAnnotationColorState(color),
    [],
  )
  const setActiveAnnotationWidth = React.useCallback(
    (width: number) => setActiveAnnotationWidthState(width),
    [],
  )

  const setMimeType = React.useCallback(
    (next: string | null) => setMimeTypeState(next),
    [],
  )

  const presets = React.useMemo(() => {
    if (options.presets) return options.presets
    if (options.additionalPresets) {
      return [...DEFAULT_PRESETS, ...options.additionalPresets]
    }
    return DEFAULT_PRESETS
  }, [options.presets, options.additionalPresets])

  // ── Filter setters ───────────────────────────────────────────────────────

  const setFilters = React.useCallback(
    (next: FilterState) => setFiltersState(next),
    [setFiltersState],
  )

  const setFilter = React.useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFiltersState({ ...filters, [key]: value })
    },
    [filters, setFiltersState],
  )

  const resetFilters = React.useCallback(
    () => setFiltersState({ ...NEUTRAL_FILTERS }),
    [setFiltersState],
  )

  const applyPreset = React.useCallback(
    (preset: FilterPreset | string) => {
      const resolved =
        typeof preset === "string"
          ? presets.find((p) => p.id === preset)
          : preset
      if (!resolved) return
      setFiltersState(mergePreset(resolved))
    },
    [presets, setFiltersState],
  )

  // ── Tool ─────────────────────────────────────────────────────────────────

  const setTool = React.useCallback(
    (next: EditorTool) => setToolState(next),
    [setToolState],
  )

  // ── Annotations ──────────────────────────────────────────────────────────

  const addAnnotation = React.useCallback(
    (stroke: AnnotationStroke) =>
      setAnnotationsState((prev) => [...prev, stroke]),
    [setAnnotationsState],
  )

  const updateAnnotation = React.useCallback(
    (id: string, patch: Partial<AnnotationStroke>) =>
      setAnnotationsState((prev) =>
        prev.map((stroke) =>
          stroke.id === id ? { ...stroke, ...patch } : stroke,
        ),
      ),
    [setAnnotationsState],
  )

  const removeAnnotation = React.useCallback(
    (id: string) =>
      setAnnotationsState((prev) => prev.filter((s) => s.id !== id)),
    [setAnnotationsState],
  )

  const clearAnnotations = React.useCallback(
    () => setAnnotationsState([]),
    [setAnnotationsState],
  )

  // ── Freeform / perspective ───────────────────────────────────────────────

  const setFreeformPath = React.useCallback(
    (next: FreeformPath | null) => setFreeformPathState(next),
    [setFreeformPathState],
  )
  const clearFreeformPath = React.useCallback(
    () => setFreeformPathState(null),
    [setFreeformPathState],
  )

  const setPerspective = React.useCallback(
    (next: PerspectiveCorners | null) => setPerspectiveState(next),
    [setPerspectiveState],
  )
  const resetPerspective = React.useCallback(
    () => setPerspectiveState(null),
    [setPerspectiveState],
  )

  // ── History ──────────────────────────────────────────────────────────────
  //
  // Snapshots are stored in a single array with a moving cursor. pushHistory
  // truncates anything past the cursor (forking off a new branch) and
  // appends the current state. undo/redo just shift the cursor and re-apply
  // the snapshot at the new position.

  const historyRef = React.useRef<EditorSnapshot[]>([])
  const cursorRef = React.useRef(-1)
  const [historyTick, setHistoryTick] = React.useState(0)

  // Latest-state ref so pushHistory / undo / redo always read fresh values
  // without forcing the callbacks to re-create per render.
  const stateRef = React.useRef({
    filters,
    annotations,
    freeformPath,
    perspective,
    cropper,
  })
  React.useEffect(() => {
    stateRef.current = {
      filters,
      annotations,
      freeformPath,
      perspective,
      cropper,
    }
  })

  const captureSnapshot = React.useCallback((): EditorSnapshot => {
    const s = stateRef.current
    return {
      filters: { ...s.filters },
      annotations: s.annotations.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((p) => ({ ...p })),
      })),
      freeformPath: s.freeformPath
        ? { points: s.freeformPath.points.map((p) => ({ ...p })) }
        : null,
      perspective: s.perspective
        ? {
            topLeft: { ...s.perspective.topLeft },
            topRight: { ...s.perspective.topRight },
            bottomRight: { ...s.perspective.bottomRight },
            bottomLeft: { ...s.perspective.bottomLeft },
          }
        : null,
      crop: { ...s.cropper.crop },
      zoom: s.cropper.zoom,
      rotation: s.cropper.rotation,
      flip: { ...s.cropper.flip },
      imagePosition: { ...s.cropper.imagePosition },
    }
  }, [])

  const applySnapshot = React.useCallback(
    (snapshot: EditorSnapshot) => {
      const s = stateRef.current
      setFiltersState(snapshot.filters)
      setAnnotationsState(snapshot.annotations)
      setFreeformPathState(snapshot.freeformPath)
      setPerspectiveState(snapshot.perspective)
      s.cropper.setCrop(snapshot.crop)
      s.cropper.setZoom(snapshot.zoom)
      s.cropper.setRotation(snapshot.rotation)
      s.cropper.setFlip(snapshot.flip)
      s.cropper.setImagePosition(snapshot.imagePosition)
    },
    [
      setFiltersState,
      setAnnotationsState,
      setFreeformPathState,
      setPerspectiveState,
    ],
  )

  const pushHistory = React.useCallback(() => {
    const snapshot = captureSnapshot()
    const cursor = cursorRef.current
    // Discard any redoable future when a new branch is forked.
    historyRef.current = historyRef.current.slice(0, cursor + 1)
    historyRef.current.push(snapshot)
    if (historyRef.current.length > historyLimit) {
      const drop = historyRef.current.length - historyLimit
      historyRef.current = historyRef.current.slice(drop)
    }
    cursorRef.current = historyRef.current.length - 1
    setHistoryTick((t) => t + 1)
  }, [captureSnapshot, historyLimit])

  const undo = React.useCallback(() => {
    if (cursorRef.current <= 0) return
    cursorRef.current -= 1
    const snapshot = historyRef.current[cursorRef.current]
    if (snapshot) applySnapshot(snapshot)
    setHistoryTick((t) => t + 1)
  }, [applySnapshot])

  const redo = React.useCallback(() => {
    if (cursorRef.current >= historyRef.current.length - 1) return
    cursorRef.current += 1
    const snapshot = historyRef.current[cursorRef.current]
    if (snapshot) applySnapshot(snapshot)
    setHistoryTick((t) => t + 1)
  }, [applySnapshot])

  // canUndo / canRedo derive from the cursor + history length, both of
  // which live in refs (the history array would be expensive to mirror in
  // state). Mirror just the booleans into state, refreshed whenever the
  // history changes via historyTick. This avoids reading ref.current
  // during render (which the React compiler / strict-mode lint forbid).
  const [historyFlags, setHistoryFlags] = React.useState({
    canUndo: false,
    canRedo: false,
  })
  React.useEffect(() => {
    setHistoryFlags({
      canUndo: cursorRef.current > 0,
      canRedo: cursorRef.current < historyRef.current.length - 1,
    })
  }, [historyTick])
  const { canUndo, canRedo } = historyFlags

  // Seed history with the initial state so undo can return to it once a
  // mutation has been pushed. Done inside an effect to avoid running during
  // the render where setHistoryTick would warn.
  const seededRef = React.useRef(false)
  React.useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    historyRef.current = [captureSnapshot()]
    cursorRef.current = 0
    setHistoryTick((t) => t + 1)
  }, [captureSnapshot])

  // ── Filter CSS ───────────────────────────────────────────────────────────

  const filterCss = React.useMemo(() => buildFilterCss(filters), [filters])

  // ── Extensions ───────────────────────────────────────────────────────────

  const extensionsRef = React.useRef<Map<string, ExtensionHandler>>(
    new Map(Object.entries(options.extensions ?? {})),
  )
  // Track registry version so consumers reading hasExtension re-render after
  // a registration. Underlying map is a ref to avoid re-instantiating on
  // every register call.
  const [extensionTick, setExtensionTick] = React.useState(0)

  const registerExtension = React.useCallback(
    (name: string, handler: ExtensionHandler) => {
      extensionsRef.current.set(name, handler)
      setExtensionTick((t) => t + 1)
    },
    [],
  )
  const unregisterExtension = React.useCallback((name: string) => {
    extensionsRef.current.delete(name)
    setExtensionTick((t) => t + 1)
  }, [])
  const hasExtension = React.useCallback(
    (name: string): boolean => {
      void extensionTick
      return extensionsRef.current.has(name)
    },
    [extensionTick],
  )

  const runExtension = React.useCallback(
    async (name: string): Promise<ExtensionOutput | null> => {
      const handler = extensionsRef.current.get(name)
      if (!handler) return null
      const img = cropper.imageRef.current
      if (!img) return null
      const input: ExtensionInput = {
        image: img,
        filters,
        crop: cropper.crop,
        freeformPath,
      }
      const output = await handler(input)
      // Auto-apply known output channels: a returned ImageBitmap replaces
      // the canvas-pipeline source so subsequent exports use it; a
      // returned mask becomes the freeform path. Consumers who want raw
      // outputs without auto-application can read the return value
      // directly and ignore it.
      if (output.image) {
        cropper.setOrientedSource(output.image)
      }
      if (output.mask) {
        setFreeformPathState(output.mask)
      }
      pushHistory()
      return output
    },
    [cropper, filters, freeformPath, pushHistory, setFreeformPathState],
  )

  // ── Edited-image output ──────────────────────────────────────────────────
  //
  // Phase 2: bake the live filter chain into the cropper's canvas pipeline
  // by passing filterCss through to getCroppedImage. Phases 5-7 will extend
  // this with annotation compositing, freeform mask clipping, and
  // perspective transforms; we factor that out then.

  const getEditedImage = React.useCallback(
    async (
      options: GetCroppedImageOptions = {},
    ): Promise<Blob | string | null> => {
      const userPostDraw = options.postDraw
      return cropper.getCroppedImage({
        ...options,
        filter: options.filter ?? filterCss,
        postDraw: (ctx, viewport) => {
          // Perspective: erase the originally-drawn image and re-draw it
          // warped into the user-defined quad. Runs before freeform/clip
          // and annotations so those layer on top of the warped image.
          // The filter chain is reapplied here too — without it,
          // perspective + adjust would silently drop the adjustments
          // because the unfiltered redraw replaces the filtered original.
          if (perspective) {
            const img = cropper.imageRef.current
            if (img && cropper.image.naturalWidth > 0) {
              const activeFilter = options.filter ?? filterCss
              ctx.save()
              ctx.globalCompositeOperation = "destination-out"
              ctx.fillStyle = "#000"
              ctx.fillRect(0, 0, viewport.width, viewport.height)
              ctx.restore()
              ctx.save()
              if (activeFilter && activeFilter !== "none") {
                ctx.filter = activeFilter
              }
              drawPerspectiveQuad(
                ctx,
                img,
                {
                  x: 0,
                  y: 0,
                  width: cropper.image.naturalWidth,
                  height: cropper.image.naturalHeight,
                },
                perspective,
              )
              ctx.restore()
            }
          }
          // Freeform clip: erase pixels outside the closed path. Run before
          // annotations so markings stay visible even outside the mask.
          if (freeformPath && freeformPath.points.length >= 3) {
            ctx.save()
            ctx.globalCompositeOperation = "destination-in"
            ctx.beginPath()
            const [first, ...rest] = freeformPath.points
            if (first) {
              ctx.moveTo(first.x, first.y)
              for (const p of rest) ctx.lineTo(p.x, p.y)
              ctx.closePath()
              ctx.fill()
            }
            ctx.restore()
          }
          // Annotations render in viewport coordinates, in source order, on
          // top of the (filtered, optionally clipped) image. userPostDraw
          // fires last so consumer-supplied overlays can layer above
          // everything.
          for (const stroke of annotations) {
            drawStroke(ctx, stroke)
          }
          userPostDraw?.(ctx, viewport)
        },
      })
    },
    [annotations, cropper, filterCss, freeformPath, perspective],
  )

  return {
    cropper,
    filters,
    tool,
    annotations,
    freeformPath,
    perspective,
    presets,
    setFilters,
    setFilter,
    resetFilters,
    applyPreset,
    setTool,
    mimeType,
    setMimeType,
    activeAnnotationKind,
    activeAnnotationColor,
    activeAnnotationWidth,
    activeAnnotationOpacity,
    setActiveAnnotationKind,
    setActiveAnnotationColor,
    setActiveAnnotationWidth,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    setFreeformPath,
    clearFreeformPath,
    setPerspective,
    resetPerspective,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    filterCss,
    registerExtension,
    unregisterExtension,
    hasExtension,
    runExtension,
    getEditedImage,
  }
}

// Re-exports so consumers can import everything from the hook module.
export type { Point }
