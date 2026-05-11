import * as React from "react"
import {
  Box,
  Circle as CircleIcon,
  Crop,
  Highlighter,
  Lasso,
  MoveUpRight,
  Pen,
  PenTool,
  Square,
  SlidersHorizontal,
  Type,
} from "lucide-react"
import { cn } from "@lib/utils"
import { Button } from "@components/button"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
  ColorPickerTrigger,
} from "@components/color-picker"
import { Slider } from "@components/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/tooltip"
import {
  ImageCropperGrid,
  ImageCropperHandle,
  ImageCropperImage,
  ImageCropperRootProvider,
  ImageCropperSelection,
  ImageCropperViewport,
  type ImageCropperGridProps,
  type ImageCropperHandleProps,
} from "@components/image-cropper"
import {
  useImageEditor,
  type UseImageEditorOptions,
  type UseImageEditorReturn,
} from "./useImageEditor"
import { drawStroke } from "./annotationDraw"
import {
  FILTER_RANGES,
  type AnnotationKind,
  type AnnotationStroke,
  type EditorTool,
  type FilterPreset,
  type FilterState,
  type FreeformPath,
  type PerspectiveCorners,
  type Point,
} from "./types"
import "./image-editor.css"

const ImageEditorContext = React.createContext<UseImageEditorReturn | null>(
  null,
)

function useImageEditorContext(consumer: string): UseImageEditorReturn {
  const ctx = React.useContext(ImageEditorContext)
  if (!ctx) {
    throw new Error(
      `<${consumer}> must be rendered inside <ImageEditor> or <ImageEditorRootProvider>`,
    )
  }
  return ctx
}

export interface ImageEditorProps
  extends
    UseImageEditorOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof UseImageEditorOptions> {
  ref?: React.Ref<HTMLDivElement>
}

const EDITOR_OPTION_KEYS = new Set<string>([
  // Editor-only options
  "filters",
  "defaultFilters",
  "onFiltersChange",
  "tool",
  "defaultTool",
  "onToolChange",
  "annotations",
  "defaultAnnotations",
  "onAnnotationsChange",
  "freeformPath",
  "defaultFreeformPath",
  "onFreeformPathChange",
  "perspective",
  "defaultPerspective",
  "onPerspectiveChange",
  "presets",
  "additionalPresets",
  "historyLimit",
  "extensions",
  // Inherited cropper options (still routed into useImageEditor which
  // forwards them to the inner cropper)
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
])

function splitEditorOptions(
  props: Record<string, unknown>,
): [UseImageEditorOptions, Record<string, unknown>] {
  const editor: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (EDITOR_OPTION_KEYS.has(key)) editor[key] = value
    else rest[key] = value
  }
  return [editor as UseImageEditorOptions, rest]
}

function ImageEditor({ className, children, ref, ...props }: ImageEditorProps) {
  const [editorOptions, rest] = splitEditorOptions(
    props as Record<string, unknown>,
  )
  const editor = useImageEditor(editorOptions)
  return (
    <ImageEditorContext.Provider value={editor}>
      <ImageCropperRootProvider
        value={editor.cropper}
        ref={ref}
        className={cn("dr-image-editor", className)}
        data-tool={editor.tool}
        {...rest}
      >
        {children}
      </ImageCropperRootProvider>
    </ImageEditorContext.Provider>
  )
}

export interface ImageEditorRootProviderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  value: UseImageEditorReturn
  children?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}

function ImageEditorRootProvider({
  className,
  children,
  value,
  ref,
  ...rest
}: ImageEditorRootProviderProps) {
  return (
    <ImageEditorContext.Provider value={value}>
      <ImageCropperRootProvider
        value={value.cropper}
        ref={ref}
        className={cn("dr-image-editor", className)}
        data-tool={value.tool}
        {...rest}
      >
        {children}
      </ImageCropperRootProvider>
    </ImageEditorContext.Provider>
  )
}

export interface ImageEditorContextProps {
  children: (api: UseImageEditorReturn) => React.ReactNode
}

function ImageEditorContextConsumer({ children }: ImageEditorContextProps) {
  const editor = useImageEditorContext("ImageEditorContext")
  return <>{children(editor)}</>
}

// ── Re-exported geometry parts ──────────────────────────────────────────────
//
// Viewport / Selection / Handle / Grid don't need editor-specific behaviour
// in phase 2 — they read from the cropper context that ImageEditor's Root
// already provides. Renamed exports below give consumers a consistent
// import surface (everything for editor work comes from image-editor).

const ImageEditorViewport = ImageCropperViewport
const ImageEditorSelection = ImageCropperSelection

function ImageEditorHandle(props: ImageCropperHandleProps) {
  return <ImageCropperHandle {...props} />
}
function ImageEditorGrid(props: ImageCropperGridProps) {
  return <ImageCropperGrid {...props} />
}

// ── Image with live filter ──────────────────────────────────────────────────

// Map a src string to its MIME type. Handles data URLs directly (the
// MIME is in the prefix); falls back to file-extension lookup for plain
// URLs. Returns null when the type can't be inferred.
function detectMimeType(src: string): string | null {
  if (src.startsWith("data:")) {
    const match = src.match(/^data:([^;,]+)/)
    return match?.[1] ?? null
  }
  const m = src.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/)
  if (!m) return null
  const ext = m[1]
  switch (ext) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
    case "jfif":
      return "image/jpeg"
    case "webp":
      return "image/webp"
    case "avif":
      return "image/avif"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "bmp":
      return "image/bmp"
    case "ico":
      return "image/vnd.microsoft.icon"
    default:
      return null
  }
}

function ImageEditorImage({
  className,
  style,
  ref,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  ref?: React.Ref<HTMLImageElement>
}) {
  const editor = useImageEditorContext("ImageEditorImage")

  // Propagate the MIME type to the editor whenever src changes so the
  // status bar (and any consumer reading editor.mimeType) reflects the
  // currently loaded image.
  const src = rest.src
  const setMimeType = editor.setMimeType
  React.useEffect(() => {
    if (typeof src !== "string" || src.length === 0) {
      setMimeType(null)
      return
    }
    setMimeType(detectMimeType(src))
  }, [src, setMimeType])
  // The image element fills the viewport with object-fit: contain. We can't
  // CSS-warp it to match an arbitrary perspective quad cheaply (matrix3d
  // would need an 8-coefficient projective solve), but we can at least
  // mask the visible area to the user-defined quad so they see the bounds
  // they're defining. Coordinates flow from the SVG overlay (in viewport
  // pixels) into clip-path percentages relative to the viewport.
  let clipPath: string | undefined
  if (editor.perspective && editor.cropper.viewport.width > 0) {
    const v = editor.cropper.viewport
    const c = editor.perspective
    const pct = (n: number, total: number) => `${(n / total) * 100}%`
    clipPath =
      `polygon(${pct(c.topLeft.x, v.width)} ${pct(c.topLeft.y, v.height)}, ` +
      `${pct(c.topRight.x, v.width)} ${pct(c.topRight.y, v.height)}, ` +
      `${pct(c.bottomRight.x, v.width)} ${pct(c.bottomRight.y, v.height)}, ` +
      `${pct(c.bottomLeft.x, v.width)} ${pct(c.bottomLeft.y, v.height)})`
  }
  return (
    <ImageCropperImage
      ref={ref}
      className={cn("dr-image-editor-image", className)}
      style={{ filter: editor.filterCss, clipPath, ...style }}
      {...rest}
    />
  )
}

// ── Adjust panel ────────────────────────────────────────────────────────────

export interface ImageEditorAdjustProps {
  channel: keyof FilterState
  label?: string
  className?: string
}

const ADJUST_LABELS: Record<keyof FilterState, string> = {
  brightness: "Brightness",
  contrast: "Contrast",
  saturation: "Saturation",
  hueRotate: "Hue",
  blur: "Blur",
  grayscale: "Grayscale",
  sepia: "Sepia",
}

function formatAdjustValue(channel: keyof FilterState, value: number): string {
  if (channel === "hueRotate") return `${Math.round(value)}°`
  if (channel === "blur") return `${value.toFixed(1)}px`
  return value.toFixed(2)
}

/**
 * A single labelled slider for one filter channel. Bound to the editor's
 * controlled state via setFilter. Uses the project's `<Slider>` compound
 * for keyboard accessibility, focus styling, and design-system parity
 * with other slider rails in the app.
 */
function ImageEditorAdjust({
  channel,
  label,
  className,
}: ImageEditorAdjustProps) {
  const editor = useImageEditorContext("ImageEditorAdjust")
  const range = FILTER_RANGES[channel]
  const value = editor.filters[channel]
  return (
    <div className={cn("dr-image-editor-adjust", className)}>
      <span className="dr-image-editor-adjust-label">
        {label ?? ADJUST_LABELS[channel]}
      </span>
      <Slider
        value={[value]}
        onValueChange={(arr) => {
          const next = arr[0]
          if (typeof next === "number") editor.setFilter(channel, next)
        }}
        onValueCommit={() => editor.pushHistory()}
        min={range.min}
        max={range.max}
        step={range.step}
      />
      <span className="dr-image-editor-adjust-value">
        {formatAdjustValue(channel, value)}
      </span>
    </div>
  )
}

export interface ImageEditorAdjustPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Filter channels to render. Defaults to all seven. Order is preserved. */
  channels?: Array<keyof FilterState>
  ref?: React.Ref<HTMLDivElement>
}

const DEFAULT_ADJUST_CHANNELS: Array<keyof FilterState> = [
  "brightness",
  "contrast",
  "saturation",
  "hueRotate",
  "blur",
  "grayscale",
  "sepia",
]

function ImageEditorAdjustPanel({
  className,
  channels,
  children,
  ref,
  ...rest
}: ImageEditorAdjustPanelProps) {
  return (
    <div
      ref={ref}
      className={cn("dr-image-editor-adjust-panel", className)}
      {...rest}
    >
      {children ??
        (channels ?? DEFAULT_ADJUST_CHANNELS).map((channel) => (
          <ImageEditorAdjust key={channel} channel={channel} />
        ))}
    </div>
  )
}

function isFiltersNeutral(f: FilterState): boolean {
  return (
    f.brightness === 1 &&
    f.contrast === 1 &&
    f.saturation === 1 &&
    f.hueRotate === 0 &&
    f.blur === 0 &&
    f.grayscale === 0 &&
    f.sepia === 0
  )
}

export interface ImageEditorAdjustClearProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * Resets every filter channel to its neutral identity (brightness=1,
 * contrast=1, etc.) and pushes a history entry so the reset is undoable.
 * Disabled when the filter state is already at neutral so the button
 * doesn't pile no-op snapshots onto the history stack.
 */
function ImageEditorAdjustClear({
  className,
  children,
  disabled,
  onClick,
  ref,
  ...rest
}: ImageEditorAdjustClearProps) {
  const editor = useImageEditorContext("ImageEditorAdjustClear")
  const neutral = isFiltersNeutral(editor.filters)
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className={className}
      disabled={disabled ?? neutral}
      data-action="adjust-clear"
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        editor.resetFilters()
        editor.pushHistory()
      }}
      {...rest}
    >
      {children ?? "Clear"}
    </Button>
  )
}

// ── Presets ─────────────────────────────────────────────────────────────────

export interface ImageEditorPresetProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  preset: FilterPreset | string
  ref?: React.Ref<HTMLButtonElement>
}

function resolvePreset(
  presets: FilterPreset[],
  preset: FilterPreset | string,
): FilterPreset | undefined {
  if (typeof preset !== "string") return preset
  return presets.find((p) => p.id === preset)
}

function ImageEditorPreset({
  preset,
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorPresetProps) {
  const editor = useImageEditorContext("ImageEditorPreset")
  const resolved = resolvePreset(editor.presets, preset)
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={cn("dr-image-editor-preset", className)}
      data-preset={resolved?.id}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (resolved) {
          editor.applyPreset(resolved)
          editor.pushHistory()
        }
      }}
      {...rest}
    >
      {children ?? resolved?.label}
    </Button>
  )
}

export interface ImageEditorPresetsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset ids to render. Defaults to every entry from the editor's
   *  resolved presets list. */
  ids?: string[]
  ref?: React.Ref<HTMLDivElement>
}

function ImageEditorPresets({
  className,
  ids,
  children,
  ref,
  ...rest
}: ImageEditorPresetsProps) {
  const editor = useImageEditorContext("ImageEditorPresets")
  const visible = ids
    ? editor.presets.filter((p) => ids.includes(p.id))
    : editor.presets
  return (
    <div
      ref={ref}
      className={cn("dr-image-editor-presets", className)}
      {...rest}
    >
      {children ??
        visible.map((preset) => (
          <ImageEditorPreset key={preset.id} preset={preset} />
        ))}
    </div>
  )
}

// ── Tools switcher ──────────────────────────────────────────────────────────

const DEFAULT_TOOLS: EditorTool[] = [
  "crop",
  "adjust",
  "annotate",
  "freeform",
  "perspective",
]

const TOOL_LABELS: Record<EditorTool, string> = {
  crop: "Crop",
  adjust: "Adjust",
  annotate: "Annotate",
  freeform: "Freeform",
  perspective: "Perspective",
}

const TOOL_ICONS: Record<
  EditorTool,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  crop: Crop,
  adjust: SlidersHorizontal,
  annotate: PenTool,
  freeform: Lasso,
  perspective: Box,
}

export interface ImageEditorToolProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tool: EditorTool
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorTool({
  tool,
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorToolProps) {
  const editor = useImageEditorContext("ImageEditorTool")
  const active = editor.tool === tool
  const label = TOOL_LABELS[tool]
  const Icon = TOOL_ICONS[tool]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          role="radio"
          aria-checked={active}
          aria-label={label}
          variant={active ? "default" : "ghost"}
          size="icon"
          className={cn("dr-image-editor-tool", className)}
          data-tool={tool}
          data-state={active ? "active" : "inactive"}
          onClick={(event) => {
            onClick?.(event)
            if (event.defaultPrevented) return
            editor.setTool(tool)
          }}
          {...rest}
        >
          {children ?? <Icon className="h-4 w-4" aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export interface ImageEditorToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tool ids to render. Defaults to every editor tool. */
  tools?: EditorTool[]
  ref?: React.Ref<HTMLDivElement>
}

function ImageEditorTools({
  className,
  tools,
  children,
  ref,
  ...rest
}: ImageEditorToolsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Editor tool"
        className={cn("dr-image-editor-tools", className)}
        {...rest}
      >
        {children ??
          (tools ?? DEFAULT_TOOLS).map((tool) => (
            <ImageEditorTool key={tool} tool={tool} />
          ))}
      </div>
    </TooltipProvider>
  )
}

// ── Free-rotate slider ──────────────────────────────────────────────────────
//
// Continuous-degree rotation control bound to cropper.rotation. Slider runs
// 0..360 by default; the cropper hook already wraps the value into the
// canonical range, so callers can pass any min/max they like and the visible
// rotation will normalize.

export interface ImageEditorRotationSliderProps {
  min?: number
  max?: number
  step?: number
  className?: string
}

function ImageEditorRotationSlider({
  className,
  min = 0,
  max = 360,
  step = 1,
}: ImageEditorRotationSliderProps) {
  const editor = useImageEditorContext("ImageEditorRotationSlider")
  return (
    <div className={cn("dr-image-editor-rotation", className)}>
      <span className="dr-image-editor-rotation-label">Rotation</span>
      <Slider
        value={[editor.cropper.rotation]}
        onValueChange={(arr) => {
          const next = arr[0]
          if (typeof next === "number") editor.cropper.setRotation(next)
        }}
        onValueCommit={() => editor.pushHistory()}
        min={min}
        max={max}
        step={step}
      />
      <span className="dr-image-editor-rotation-value">
        {Math.round(editor.cropper.rotation)}°
      </span>
    </div>
  )
}

// ── History triggers ────────────────────────────────────────────────────────

export interface ImageEditorUndoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorUndo({
  className,
  children,
  disabled,
  onClick,
  ref,
  ...rest
}: ImageEditorUndoProps) {
  const editor = useImageEditorContext("ImageEditorUndo")
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      data-action="undo"
      aria-label="Undo"
      disabled={disabled ?? !editor.canUndo}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        editor.undo()
      }}
      {...rest}
    >
      {children ?? "Undo"}
    </Button>
  )
}

export interface ImageEditorRedoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorRedo({
  className,
  children,
  disabled,
  onClick,
  ref,
  ...rest
}: ImageEditorRedoProps) {
  const editor = useImageEditorContext("ImageEditorRedo")
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      data-action="redo"
      aria-label="Redo"
      disabled={disabled ?? !editor.canRedo}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        editor.redo()
      }}
      {...rest}
    >
      {children ?? "Redo"}
    </Button>
  )
}

// ── Annotation layer ────────────────────────────────────────────────────────
//
// Canvas overlay sized to the viewport. Captures pointer events only when
// `editor.tool === "annotate"` (CSS gates pointer-events via the data-tool
// attribute on the editor root); otherwise events fall through to the
// cropper selection / handles. Strokes are rendered live (committed +
// in-flight draft) and committed to history on pointerup.

function makeStrokeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ImageEditorAnnotationLayer({
  className,
  ref,
  ...rest
}: React.HTMLAttributes<HTMLCanvasElement> & {
  ref?: React.Ref<HTMLCanvasElement>
}) {
  const editor = useImageEditorContext("ImageEditorAnnotationLayer")
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const composedRef = React.useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  // Track the in-flight draft separately from the committed list so we can
  // render the user's pull without triggering a state push per pointermove
  // (and without polluting the history stack until the gesture ends).
  const [draft, setDraft] = React.useState<AnnotationStroke | null>(null)
  const dragRef = React.useRef<{ pointerId: number } | null>(null)

  // Text annotation: a click in text mode opens an inline text input
  // anchored at the click point. Enter or blur commits; Escape cancels.
  const [textDraft, setTextDraft] = React.useState<{
    point: Point
    value: string
  } | null>(null)
  const textInputRef = React.useRef<HTMLInputElement | null>(null)

  // Resize the backing canvas to match the viewport. ResizeObserver mirrors
  // the cropper's pattern so the layer keeps tracking parent layout
  // changes, including aspect-driven resizes.
  React.useEffect(() => {
    const viewport = editor.cropper.viewportRef.current
    const canvas = canvasRef.current
    if (!viewport || !canvas) return
    const update = () => {
      const rect = viewport.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [editor.cropper.viewportRef])

  // Drop any in-flight draft when the tool switches away from annotate so
  // a stray gesture doesn't keep capturing pointers.
  React.useEffect(() => {
    if (editor.tool !== "annotate") {
      dragRef.current = null
      setDraft(null)
      setTextDraft(null)
    }
  }, [editor.tool])

  // Auto-focus the text input when it appears.
  React.useEffect(() => {
    if (textDraft) textInputRef.current?.focus()
  }, [textDraft])

  // Render committed strokes plus the live draft on every change.
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of editor.annotations) drawStroke(ctx, stroke)
    if (draft) drawStroke(ctx, draft)
  }, [editor.annotations, draft])

  const pointForEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const isTwoPointKind = (kind: AnnotationKind) =>
    kind === "rectangle" || kind === "circle" || kind === "arrow"

  const commitText = React.useCallback(() => {
    setTextDraft((prev) => {
      if (prev && prev.value.trim().length > 0) {
        editor.addAnnotation({
          id: makeStrokeId(),
          kind: "text",
          color: editor.activeAnnotationColor,
          width: editor.activeAnnotationWidth,
          opacity: editor.activeAnnotationOpacity,
          points: [prev.point],
          text: prev.value,
        })
        editor.pushHistory()
      }
      return null
    })
  }, [editor])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (editor.tool !== "annotate") return
    if (event.pointerType === "mouse" && event.button !== 0) return
    const point = pointForEvent(event)
    // Text mode: open an inline input. Commit any open input first so the
    // user can place multiple text annotations in succession.
    if (editor.activeAnnotationKind === "text") {
      commitText()
      setTextDraft({ point, value: "" })
      event.preventDefault()
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId }
    setDraft({
      id: makeStrokeId(),
      kind: editor.activeAnnotationKind,
      color: editor.activeAnnotationColor,
      width: editor.activeAnnotationWidth,
      opacity: editor.activeAnnotationOpacity,
      points: [point],
    })
    event.preventDefault()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const point = pointForEvent(event)
    setDraft((prev) => {
      if (!prev) return prev
      // Two-point primitives only need a start and end; replacing the
      // last point keeps the rectangle / circle / arrow snappy as the
      // user drags and avoids storing a noisy point cloud in history.
      if (isTwoPointKind(prev.kind)) {
        const start = prev.points[0]
        if (!start) return prev
        return { ...prev, points: [start, point] }
      }
      return { ...prev, points: [...prev.points, point] }
    })
  }

  const finishStroke = (
    event: React.PointerEvent<HTMLCanvasElement>,
    commit: boolean,
  ) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDraft((prev) => {
      if (!commit || !prev) return null
      // Reject zero-area rect/circle (a click without drag) so accidental
      // taps don't pollute the canvas with invisible strokes.
      if (isTwoPointKind(prev.kind) && prev.points.length >= 2) {
        const a = prev.points[0]
        const b = prev.points[prev.points.length - 1]
        if (a && b && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1) {
          return null
        }
      }
      editor.addAnnotation(prev)
      editor.pushHistory()
      return null
    })
  }

  return (
    <>
      <canvas
        ref={composedRef}
        className={cn("dr-image-editor-annotation-layer", className)}
        data-active={editor.tool === "annotate" ? "true" : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishStroke(event, true)}
        onPointerCancel={(event) => finishStroke(event, false)}
        {...rest}
      />
      {textDraft && (
        <input
          ref={textInputRef}
          className="dr-image-editor-annotation-text-input"
          style={{
            position: "absolute",
            left: textDraft.point.x,
            top: textDraft.point.y,
            color: editor.activeAnnotationColor,
            fontSize: Math.max(editor.activeAnnotationWidth * 4, 12),
          }}
          value={textDraft.value}
          onChange={(event) =>
            setTextDraft((prev) =>
              prev ? { ...prev, value: event.target.value } : prev,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commitText()
            } else if (event.key === "Escape") {
              event.preventDefault()
              setTextDraft(null)
            }
          }}
          onBlur={commitText}
          placeholder="Type, then Enter"
        />
      )}
    </>
  )
}

// ── Annotation toolbar parts ────────────────────────────────────────────────

const ANNOTATION_KIND_LABELS: Record<AnnotationKind, string> = {
  pen: "Pen",
  highlighter: "Highlight",
  arrow: "Arrow",
  rectangle: "Rectangle",
  circle: "Circle",
  text: "Text",
}

const ANNOTATION_KIND_ICONS: Record<
  AnnotationKind,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  pen: Pen,
  highlighter: Highlighter,
  arrow: MoveUpRight,
  rectangle: Square,
  circle: CircleIcon,
  text: Type,
}

export interface ImageEditorAnnotationKindProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind: AnnotationKind
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorAnnotationKind({
  kind,
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorAnnotationKindProps) {
  const editor = useImageEditorContext("ImageEditorAnnotationKind")
  const active = editor.activeAnnotationKind === kind
  const label = ANNOTATION_KIND_LABELS[kind]
  const Icon = ANNOTATION_KIND_ICONS[kind]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          role="radio"
          aria-checked={active}
          aria-label={label}
          variant={active ? "default" : "ghost"}
          size="icon"
          className={cn("dr-image-editor-annotation-kind", className)}
          data-kind={kind}
          data-state={active ? "active" : "inactive"}
          onClick={(event) => {
            onClick?.(event)
            if (event.defaultPrevented) return
            editor.setActiveAnnotationKind(kind)
          }}
          {...rest}
        >
          {children ?? <Icon className="h-4 w-4" aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

export interface ImageEditorAnnotationColorProps {
  className?: string
  /** Optional preset swatches shown alongside the picker area. Defaults to
   *  six common annotation colours plus black + white. */
  swatches?: string[]
}

const DEFAULT_ANNOTATION_SWATCHES: string[] = [
  "#ef4444",
  "#f59e0b",
  "#eab308",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#000000",
  "#ffffff",
]

function ImageEditorAnnotationColor({
  className,
  swatches = DEFAULT_ANNOTATION_SWATCHES,
}: ImageEditorAnnotationColorProps) {
  const editor = useImageEditorContext("ImageEditorAnnotationColor")
  return (
    <ColorPicker
      value={editor.activeAnnotationColor}
      onValueChange={(d) => editor.setActiveAnnotationColor(d.value)}
      className={cn("dr-image-editor-annotation-color", className)}
    >
      <ColorPickerControl>
        <ColorPickerTrigger aria-label="Annotation color">
          <ColorPickerSwatch />
        </ColorPickerTrigger>
      </ColorPickerControl>
      <ColorPickerContent>
        <ColorPickerArea />
        <ColorPickerInput />
        <ColorPickerSwatchGroup>
          {swatches.map((color) => (
            <ColorPickerSwatchItem key={color} value={color} />
          ))}
        </ColorPickerSwatchGroup>
      </ColorPickerContent>
    </ColorPicker>
  )
}

export interface ImageEditorAnnotationWidthProps {
  min?: number
  max?: number
  step?: number
  className?: string
}

function ImageEditorAnnotationWidth({
  className,
  min = 1,
  max = 32,
  step = 1,
}: ImageEditorAnnotationWidthProps) {
  const editor = useImageEditorContext("ImageEditorAnnotationWidth")
  return (
    <Slider
      aria-label="Annotation width"
      min={min}
      max={max}
      step={step}
      className={cn("dr-image-editor-annotation-width", className)}
      value={[editor.activeAnnotationWidth]}
      onValueChange={(arr) => {
        const next = arr[0]
        if (typeof next === "number") editor.setActiveAnnotationWidth(next)
      }}
    />
  )
}

export interface ImageEditorAnnotationClearProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorAnnotationClear({
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorAnnotationClearProps) {
  const editor = useImageEditorContext("ImageEditorAnnotationClear")
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      disabled={editor.annotations.length === 0}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (editor.annotations.length === 0) return
        editor.clearAnnotations()
        editor.pushHistory()
      }}
      {...rest}
    >
      {children ?? "Clear"}
    </Button>
  )
}

const DEFAULT_ANNOTATION_KINDS: AnnotationKind[] = [
  "pen",
  "highlighter",
  "arrow",
  "rectangle",
  "circle",
  "text",
]

export interface ImageEditorAnnotationToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  kinds?: AnnotationKind[]
  ref?: React.Ref<HTMLDivElement>
}

function ImageEditorAnnotationToolbar({
  className,
  kinds,
  children,
  ref,
  ...rest
}: ImageEditorAnnotationToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={ref}
        role="toolbar"
        aria-label="Annotation tools"
        className={cn("dr-image-editor-annotation-toolbar", className)}
        {...rest}
      >
        {children ?? (
          <>
            <div
              role="radiogroup"
              aria-label="Annotation kind"
              className="dr-image-editor-annotation-kinds"
            >
              {(kinds ?? DEFAULT_ANNOTATION_KINDS).map((kind) => (
                <ImageEditorAnnotationKind key={kind} kind={kind} />
              ))}
            </div>
            <span className="dr-image-editor-annotation-toolbar-divider" />
            <ImageEditorAnnotationColor />
            <span className="dr-image-editor-annotation-toolbar-width">
              <ImageEditorAnnotationWidth />
            </span>
            <span className="dr-image-editor-annotation-toolbar-spacer" />
            <ImageEditorAnnotationClear />
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

// ── Freeform selection overlay ──────────────────────────────────────────────

function pathToD(points: Point[], close: boolean): string {
  const first = points[0]
  if (!first) return ""
  let d = `M ${first.x} ${first.y}`
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i]
    if (!p) continue
    d += ` L ${p.x} ${p.y}`
  }
  if (close) d += " Z"
  return d
}

export interface ImageEditorFreeformProps extends React.HTMLAttributes<SVGSVGElement> {
  ref?: React.Ref<SVGSVGElement>
}

function ImageEditorFreeform({
  className,
  ref,
  ...rest
}: ImageEditorFreeformProps) {
  const editor = useImageEditorContext("ImageEditorFreeform")
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const composedRef = React.useCallback(
    (node: SVGSVGElement | null) => {
      svgRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const [draft, setDraft] = React.useState<FreeformPath | null>(null)
  const dragRef = React.useRef<{ pointerId: number } | null>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const viewport = editor.cropper.viewportRef.current
    if (!viewport) return
    const update = () => {
      const rect = viewport.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [editor.cropper.viewportRef])

  // Drop any in-flight freeform draft when the tool switches away.
  React.useEffect(() => {
    if (editor.tool !== "freeform") {
      dragRef.current = null
      setDraft(null)
    }
  }, [editor.tool])

  const pointFor = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (editor.tool !== "freeform") return
    if (event.pointerType === "mouse" && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId }
    setDraft({ points: [pointFor(event)] })
    event.preventDefault()
  }

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    // Extract the point synchronously: React clears event.currentTarget
    // after the handler returns, and the setDraft updater below may run
    // asynchronously, so calling pointFor inside the updater would
    // dereference null.
    const point = pointFor(event)
    setDraft((prev) => (prev ? { points: [...prev.points, point] } : prev))
  }

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDraft((prev) => {
      if (prev && prev.points.length >= 3) {
        editor.setFreeformPath(prev)
        editor.pushHistory()
      }
      return null
    })
  }

  const visible = draft ?? editor.freeformPath
  const d = visible ? pathToD(visible.points, true) : ""
  const maskId = `freeform-mask-${editor.cropper.ids.root}`

  return (
    <svg
      ref={composedRef}
      className={cn("dr-image-editor-freeform", className)}
      data-active={editor.tool === "freeform" ? "true" : undefined}
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width || 1} ${size.height || 1}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      {...rest}
    >
      {visible && (
        <>
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <path d={d} fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.45)"
            mask={`url(#${maskId})`}
          />
          <path
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </>
      )}
    </svg>
  )
}

export interface ImageEditorFreeformClearProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorFreeformClear({
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorFreeformClearProps) {
  const editor = useImageEditorContext("ImageEditorFreeformClear")
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      data-action="freeform-clear"
      disabled={editor.freeformPath === null}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        editor.clearFreeformPath()
        editor.pushHistory()
      }}
      {...rest}
    >
      {children ?? "Clear selection"}
    </Button>
  )
}

// ── Perspective overlay ─────────────────────────────────────────────────────

function defaultCornersFromImage(
  viewport: { width: number; height: number },
  image: { naturalWidth: number; naturalHeight: number },
): PerspectiveCorners | null {
  if (
    viewport.width === 0 ||
    viewport.height === 0 ||
    image.naturalWidth === 0 ||
    image.naturalHeight === 0
  ) {
    return null
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
  const x = (viewport.width - dw) / 2
  const y = (viewport.height - dh) / 2
  return {
    topLeft: { x, y },
    topRight: { x: x + dw, y },
    bottomRight: { x: x + dw, y: y + dh },
    bottomLeft: { x, y: y + dh },
  }
}

const PERSPECTIVE_CORNERS = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
] as const

type PerspectiveCornerKey = (typeof PERSPECTIVE_CORNERS)[number]

export interface ImageEditorPerspectiveOverlayProps extends React.HTMLAttributes<SVGSVGElement> {
  ref?: React.Ref<SVGSVGElement>
}

function ImageEditorPerspectiveOverlay({
  className,
  ref,
  ...rest
}: ImageEditorPerspectiveOverlayProps) {
  const editor = useImageEditorContext("ImageEditorPerspectiveOverlay")
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const dragRef = React.useRef<{
    pointerId: number
    corner: PerspectiveCornerKey
  } | null>(null)

  React.useEffect(() => {
    const viewport = editor.cropper.viewportRef.current
    if (!viewport) return
    const update = () => {
      const rect = viewport.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [editor.cropper.viewportRef])

  // When the user enters perspective mode for the first time, seed corners
  // from the displayed-image rect so the overlay has something to drag.
  // Narrowed deps prevent the effect from running on every render (the
  // editor object identity changes per render); this version only fires
  // when the relevant inputs change.
  const setPerspective = editor.setPerspective
  React.useEffect(() => {
    if (editor.tool !== "perspective") return
    if (editor.perspective) return
    const initial = defaultCornersFromImage(
      editor.cropper.viewport,
      editor.cropper.image,
    )
    if (initial) setPerspective(initial)
  }, [
    editor.tool,
    editor.perspective,
    editor.cropper.viewport,
    editor.cropper.image,
    setPerspective,
  ])

  const corners = editor.perspective
  const onCornerPointerDown =
    (key: PerspectiveCornerKey) =>
    (event: React.PointerEvent<SVGCircleElement>) => {
      if (editor.tool !== "perspective") return
      if (event.pointerType === "mouse" && event.button !== 0) return
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = { pointerId: event.pointerId, corner: key }
    }
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!corners) return
    const rect = event.currentTarget.getBoundingClientRect()
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    editor.setPerspective({ ...corners, [drag.corner]: point })
  }
  const onPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    editor.pushHistory()
  }

  const polyD = corners
    ? pathToD(
        [
          corners.topLeft,
          corners.topRight,
          corners.bottomRight,
          corners.bottomLeft,
        ],
        true,
      )
    : ""

  return (
    <svg
      ref={ref}
      className={cn("dr-image-editor-perspective", className)}
      data-active={editor.tool === "perspective" ? "true" : undefined}
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width || 1} ${size.height || 1}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      {...rest}
    >
      {corners && (
        <>
          <path
            d={polyD}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          {PERSPECTIVE_CORNERS.map((key) => {
            const p = corners[key]
            return (
              <circle
                key={key}
                cx={p.x}
                cy={p.y}
                r={8}
                className="dr-image-editor-perspective-handle"
                data-corner={key}
                onPointerDown={onCornerPointerDown(key)}
              />
            )
          })}
        </>
      )}
    </svg>
  )
}

export interface ImageEditorPerspectiveResetProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorPerspectiveReset({
  className,
  children,
  onClick,
  ref,
  ...rest
}: ImageEditorPerspectiveResetProps) {
  const editor = useImageEditorContext("ImageEditorPerspectiveReset")
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      data-action="perspective-reset"
      disabled={editor.perspective === null}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        editor.resetPerspective()
        editor.pushHistory()
      }}
      {...rest}
    >
      {children ?? "Reset perspective"}
    </Button>
  )
}

// ── Extension trigger ───────────────────────────────────────────────────────

export interface ImageEditorExtensionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Name passed to registerExtension. The button is disabled if no
   *  matching extension is registered. */
  name: string
  ref?: React.Ref<HTMLButtonElement>
}

function ImageEditorExtension({
  name,
  className,
  children,
  disabled,
  onClick,
  ref,
  ...rest
}: ImageEditorExtensionProps) {
  const editor = useImageEditorContext("ImageEditorExtension")
  const [running, setRunning] = React.useState(false)
  const enabled = editor.hasExtension(name)
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className={className}
      data-extension={name}
      data-running={running ? "true" : undefined}
      disabled={(disabled ?? !enabled) || running}
      onClick={async (event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setRunning(true)
        try {
          await editor.runExtension(name)
        } finally {
          setRunning(false)
        }
      }}
      {...rest}
    >
      {children ?? name}
    </Button>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────
//
// Photoshop / Pixlr-style panel chrome — a bordered card with a muted
// header bar (uppercase small-caps title, optional leading icon, optional
// trailing action like a Clear button) and a padded body. Use this to
// wrap any tool-specific controls in a consistent professional surface.
// Inner AdjustPanel / AnnotationToolbar render bare inside this wrapper
// (CSS strips their own card chrome) so there's no double-card nesting.

export interface ImageEditorPanelProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: React.ReactNode
  icon?: React.ReactNode
  /** Slot rendered on the right edge of the header bar — typically a
   *  small action button (Clear, Reset). */
  action?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}

function ImageEditorPanel({
  className,
  title,
  icon,
  action,
  children,
  ref,
  ...rest
}: ImageEditorPanelProps) {
  const hasHeader = title != null || icon != null || action != null
  return (
    <section
      ref={ref}
      className={cn("dr-image-editor-panel", className)}
      {...rest}
    >
      {hasHeader ? (
        <header className="dr-image-editor-panel-header">
          <div className="dr-image-editor-panel-title">
            {icon ? (
              <span className="dr-image-editor-panel-icon">{icon}</span>
            ) : null}
            {title ? <span>{title}</span> : null}
          </div>
          {action ? (
            <div className="dr-image-editor-panel-action">{action}</div>
          ) : null}
        </header>
      ) : null}
      <div className="dr-image-editor-panel-body">{children}</div>
    </section>
  )
}

// ── Status bar ─────────────────────────────────────────────────────────────

/**
 * Format a MIME type like "image/png" into a short label ("PNG"). Falls
 * back to a dash when the type is unknown.
 */
function prettyMimeType(mime: string | null): string {
  if (!mime) return "—"
  if (mime.startsWith("image/")) {
    const sub = mime.slice("image/".length)
    if (sub === "svg+xml") return "SVG"
    if (sub === "vnd.microsoft.icon") return "ICO"
    return sub.toUpperCase()
  }
  return mime
}

export interface ImageEditorStatusBarItem {
  label: string
  value: React.ReactNode
}

export interface ImageEditorStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hide the status bar without unmounting it via consumer state. When
   *  false the component renders null. Default true. */
  visible?: boolean
  /** Which built-in items to render and in what order. Default:
   *  ["size", "type", "zoom"]. */
  items?: Array<"size" | "type" | "zoom" | "rotation">
  /** Additional consumer-supplied items rendered after the built-ins. */
  extraItems?: ImageEditorStatusBarItem[]
  ref?: React.Ref<HTMLDivElement>
}

function StatusItem({ label, value }: ImageEditorStatusBarItem) {
  return (
    <span className="dr-image-editor-status-item">
      <span className="dr-image-editor-status-item-label">{label}</span>
      <span className="dr-image-editor-status-item-value">{value}</span>
    </span>
  )
}

const DEFAULT_STATUS_ITEMS: Array<"size" | "type" | "zoom" | "rotation"> = [
  "size",
  "type",
  "zoom",
]

function ImageEditorStatusBar({
  className,
  visible = true,
  items = DEFAULT_STATUS_ITEMS,
  extraItems,
  ref,
  ...rest
}: ImageEditorStatusBarProps) {
  const editor = useImageEditorContext("ImageEditorStatusBar")
  if (!visible) return null
  const { naturalWidth, naturalHeight } = editor.cropper.image
  const builtIn: Record<
    "size" | "type" | "zoom" | "rotation",
    ImageEditorStatusBarItem
  > = {
    size: {
      label: "Size",
      value:
        naturalWidth && naturalHeight
          ? `${naturalWidth} × ${naturalHeight}`
          : "—",
    },
    type: { label: "Type", value: prettyMimeType(editor.mimeType) },
    zoom: {
      label: "Zoom",
      value: `${Math.round(editor.cropper.zoom * 100)}%`,
    },
    rotation: {
      label: "Rotation",
      value: `${Math.round(editor.cropper.rotation)}°`,
    },
  }
  return (
    <div
      ref={ref}
      role="status"
      aria-label="Image status"
      className={cn("dr-image-editor-status-bar", className)}
      {...rest}
    >
      {items.map((id) => (
        <StatusItem
          key={id}
          label={builtIn[id].label}
          value={builtIn[id].value}
        />
      ))}
      {extraItems?.map((item, i) => (
        <StatusItem key={`extra-${i}`} label={item.label} value={item.value} />
      ))}
    </div>
  )
}

export {
  ImageEditor,
  ImageEditorRootProvider,
  ImageEditorContextConsumer as ImageEditorContext,
  ImageEditorViewport,
  ImageEditorImage,
  ImageEditorSelection,
  ImageEditorHandle,
  ImageEditorGrid,
  ImageEditorAdjustPanel,
  ImageEditorAdjust,
  ImageEditorAdjustClear,
  ImageEditorPanel,
  ImageEditorPresets,
  ImageEditorPreset,
  ImageEditorTools,
  ImageEditorTool,
  ImageEditorRotationSlider,
  ImageEditorAnnotationLayer,
  ImageEditorAnnotationToolbar,
  ImageEditorAnnotationKind,
  ImageEditorAnnotationColor,
  ImageEditorAnnotationWidth,
  ImageEditorAnnotationClear,
  ImageEditorFreeform,
  ImageEditorFreeformClear,
  ImageEditorPerspectiveOverlay,
  ImageEditorPerspectiveReset,
  ImageEditorExtension,
  ImageEditorStatusBar,
  ImageEditorUndo,
  ImageEditorRedo,
  useImageEditorContext,
}
