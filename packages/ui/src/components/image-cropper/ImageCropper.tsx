import * as React from "react"
import { cn } from "@lib/utils"
import {
  ImageDropzone,
  type ImageDropzoneProps,
} from "@components/image-common"
import {
  useImageCropper,
  type UseImageCropperOptions,
  type UseImageCropperReturn,
} from "./useImageCropper"
import type { CropRect, GridAxis, HandlePosition } from "./types"
import "./image-cropper.css"

const ImageCropperContext = React.createContext<UseImageCropperReturn | null>(
  null,
)

function useImageCropperContext(consumer: string): UseImageCropperReturn {
  const ctx = React.useContext(ImageCropperContext)
  if (!ctx) {
    throw new Error(
      `<${consumer}> must be rendered inside <ImageCropper> or <ImageCropperRootProvider>`,
    )
  }
  return ctx
}

// ── Resize math ─────────────────────────────────────────────────────────────
//
// Given a starting rect, the handle being dragged, and the cumulative pointer
// delta in viewport coordinates, compute the new rect with the opposite edge
// or corner anchored, aspect ratio enforced (when set), and the result clamped
// to min/max while preserving the same anchor.

interface ResizeOptions {
  aspectRatio?: number
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  viewport: { width: number; height: number }
}

const HANDLES_THAT_MOVE_X = new Set<HandlePosition>([
  "top-left",
  "left",
  "bottom-left",
])
const HANDLES_THAT_MOVE_Y = new Set<HandlePosition>([
  "top-left",
  "top",
  "top-right",
])
const CORNER_HANDLES = new Set<HandlePosition>([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
])
const HORIZONTAL_EDGE_HANDLES = new Set<HandlePosition>(["top", "bottom"])
const VERTICAL_EDGE_HANDLES = new Set<HandlePosition>(["left", "right"])

function resizeCrop(
  start: CropRect,
  handle: HandlePosition,
  dx: number,
  dy: number,
  opts: ResizeOptions,
): CropRect {
  let x = start.x
  let y = start.y
  let width = start.width
  let height = start.height

  switch (handle) {
    case "top-left":
      x = start.x + dx
      y = start.y + dy
      width = start.width - dx
      height = start.height - dy
      break
    case "top":
      y = start.y + dy
      height = start.height - dy
      break
    case "top-right":
      y = start.y + dy
      width = start.width + dx
      height = start.height - dy
      break
    case "right":
      width = start.width + dx
      break
    case "bottom-right":
      width = start.width + dx
      height = start.height + dy
      break
    case "bottom":
      height = start.height + dy
      break
    case "bottom-left":
      x = start.x + dx
      width = start.width - dx
      height = start.height + dy
      break
    case "left":
      x = start.x + dx
      width = start.width - dx
      break
  }

  if (opts.aspectRatio && opts.aspectRatio > 0) {
    if (CORNER_HANDLES.has(handle)) {
      // Pick the dimension the user moved more aggressively as the driver,
      // then derive the other side from aspect ratio.
      if (Math.abs(dx) >= Math.abs(dy)) {
        height = width / opts.aspectRatio
      } else {
        width = height * opts.aspectRatio
      }
    } else if (HORIZONTAL_EDGE_HANDLES.has(handle)) {
      // Top/bottom moves height; width grows symmetrically from the
      // horizontal centerline so the rect stays visually centred on the axis
      // the user wasn't touching.
      const cx = start.x + start.width / 2
      width = height * opts.aspectRatio
      x = cx - width / 2
    } else if (VERTICAL_EDGE_HANDLES.has(handle)) {
      const cy = start.y + start.height / 2
      height = width / opts.aspectRatio
      y = cy - height / 2
    }
  }

  const maxW = Math.min(opts.maxWidth, opts.viewport.width || opts.maxWidth)
  const maxH = Math.min(opts.maxHeight, opts.viewport.height || opts.maxHeight)
  const clampedW = Math.max(opts.minWidth, Math.min(maxW, width))
  const clampedH = Math.max(opts.minHeight, Math.min(maxH, height))

  // Re-anchor: handles on the right of the rect (right, top-right,
  // bottom-right) keep the left edge fixed; handles on the left side keep
  // the right edge fixed. Same idea on the vertical axis.
  if (HANDLES_THAT_MOVE_X.has(handle)) {
    x = start.x + start.width - clampedW
  }
  if (HANDLES_THAT_MOVE_Y.has(handle)) {
    y = start.y + start.height - clampedH
  }
  width = clampedW
  height = clampedH

  // Final viewport clamp on position so dragging beyond an edge sticks
  // instead of overflowing.
  const v = opts.viewport
  if (v.width > 0) x = Math.max(0, Math.min(v.width - width, x))
  if (v.height > 0) y = Math.max(0, Math.min(v.height - height, y))

  return { x, y, width, height }
}

// ── Pointer drag helper ─────────────────────────────────────────────────────

interface DragState<T> {
  pointerId: number
  start: { x: number; y: number }
  data: T
}

function ignorePointer(event: React.PointerEvent): boolean {
  return event.pointerType === "mouse" && event.button !== 0
}

// ── Components ──────────────────────────────────────────────────────────────

export interface ImageCropperProps
  extends
    UseImageCropperOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof UseImageCropperOptions> {
  ref?: React.Ref<HTMLDivElement>
}

const HOOK_OPTION_KEYS: Array<keyof UseImageCropperOptions> = [
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

function splitHookOptions(
  props: Record<string, unknown>,
): [UseImageCropperOptions, Record<string, unknown>] {
  const hook: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if ((HOOK_OPTION_KEYS as string[]).includes(key)) {
      hook[key] = value
    } else {
      rest[key] = value
    }
  }
  return [hook as UseImageCropperOptions, rest]
}

function ImageCropper({
  className,
  children,
  ref,
  ...props
}: ImageCropperProps) {
  const [hookOptions, rest] = splitHookOptions(props as Record<string, unknown>)
  const api = useImageCropper(hookOptions)
  return (
    <ImageCropperContext.Provider value={api}>
      <div
        ref={ref}
        id={api.ids.root}
        className={cn("dr-image-cropper", className)}
        data-shape={api.cropShape}
        data-fixed={api.fixedCropArea ? "true" : undefined}
        {...rest}
      >
        {children}
      </div>
    </ImageCropperContext.Provider>
  )
}

export interface ImageCropperRootProviderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  value: UseImageCropperReturn
  children?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}

function ImageCropperRootProvider({
  className,
  children,
  value,
  ref,
  ...rest
}: ImageCropperRootProviderProps) {
  return (
    <ImageCropperContext.Provider value={value}>
      <div
        ref={ref}
        id={value.ids.root}
        className={cn("dr-image-cropper", className)}
        data-shape={value.cropShape}
        data-fixed={value.fixedCropArea ? "true" : undefined}
        {...rest}
      >
        {children}
      </div>
    </ImageCropperContext.Provider>
  )
}

export interface ImageCropperContextProps {
  children: (api: UseImageCropperReturn) => React.ReactNode
}

function ImageCropperContextConsumer({ children }: ImageCropperContextProps) {
  const api = useImageCropperContext("ImageCropperContext")
  return <>{children(api)}</>
}

function ImageCropperViewport({
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ref,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  const api = useImageCropperContext("ImageCropperViewport")
  // Extract the ref locally so the React compiler doesn't flag mutation on
  // the context-value object — `.current` assignment to a stable React ref
  // is always safe; the rule fires only on the `api.viewportRef.current`
  // property chain. Destructure the other render-read values for the same
  // reason: react-hooks/refs treats `api.X` reads during render as ref
  // accesses once it has seen the viewportRef chain elsewhere in the file.
  const viewportRef = api.viewportRef
  const { cropShape, isDragging, ids, registerViewport } = api
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [viewportRef, ref],
  )

  React.useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const update = () => {
      const rect = node.getBoundingClientRect()
      registerViewport({ width: rect.width, height: rect.height })
    }
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
    // viewportRef is a stable React ref; including it in deps would
    // re-trip react-hooks/refs without changing behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerViewport])

  // React 17+ attaches `onWheel` as a passive listener, so calling
  // preventDefault inside an onWheel handler is silently ignored and the
  // page keeps scrolling underneath the cropper. Attach a non-passive
  // native listener via useEffect so we can stop the default scroll while
  // applying the zoom delta. apiRef captures the latest hook return so the
  // listener doesn't go stale between renders. The ref starts as null and
  // is populated in an effect so we don't pass the api object to useRef
  // during render (which the react-hooks/refs rule forbids).
  const apiRef = React.useRef<typeof api | null>(null)
  React.useEffect(() => {
    apiRef.current = api
  })
  React.useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = -Math.sign(event.deltaY)
      if (delta === 0) return
      const a = apiRef.current
      if (!a) return
      a.setZoom(a.zoom + delta * a.zoomStep * a.zoomSensitivity)
    }
    node.addEventListener("wheel", onWheel, { passive: false })
    return () => node.removeEventListener("wheel", onWheel)
    // viewportRef is stable; effect needs to attach the listener once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pan-on-image-drag and two-finger pinch-zoom both originate on the
  // viewport. The selection and handles stop propagation on pointerdown so
  // they don't trigger a pan.
  const panRef = React.useRef<DragState<{
    startPosition: { x: number; y: number }
  }> | null>(null)
  const pointersRef = React.useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = React.useRef<{
    startDistance: number
    startZoom: number
  } | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    if (ignorePointer(event)) return
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values())
      if (a && b) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        pinchRef.current = {
          startDistance: Math.hypot(dx, dy),
          startZoom: api.zoom,
        }
        api.setDragging(true)
        // Pinch supersedes pan.
        panRef.current = null
      }
      return
    }
    // Only pan when the user grabs the bare viewport (not the selection or
    // a handle, which set their own pointer capture and stop propagation).
    if (event.target !== event.currentTarget) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      data: { startPosition: api.imagePosition },
    }
    api.setDragging(true)
    event.preventDefault()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    if (event.defaultPrevented) return
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
    }
    if (pinchRef.current && pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values())
      if (a && b) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy)
        if (pinchRef.current.startDistance > 0) {
          const ratio = distance / pinchRef.current.startDistance
          api.setZoom(pinchRef.current.startZoom * ratio)
        }
      }
      return
    }
    const drag = panRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    api.setImagePosition({
      x: drag.data.startPosition.x + dx,
      y: drag.data.startPosition.y + dy,
    })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event)
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
    if (pointersRef.current.size === 0) api.setDragging(false)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event)
    pointersRef.current.delete(event.pointerId)
    pinchRef.current = null
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
    if (pointersRef.current.size === 0) api.setDragging(false)
  }

  return (
    <div
      ref={composedRef}
      id={ids.viewport}
      className={cn("dr-image-cropper-viewport", className)}
      data-shape={cropShape}
      data-dragging={isDragging ? "true" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      {...rest}
    />
  )
}

function ImageCropperImage({
  className,
  onLoad,
  ref,
  style,
  src,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  ref?: React.Ref<HTMLImageElement>
}) {
  const api = useImageCropperContext("ImageCropperImage")
  const imageRef = api.imageRef
  // Destructure render-read values for the react-hooks/refs rule; once the
  // file mentions `api.imageRef.current`, the plugin treats every `api.X`
  // read during render as a ref access.
  const {
    flip,
    imagePosition,
    rotation,
    zoom,
    ids,
    registerImage,
    setOrientedSource,
  } = api
  const composedRef = React.useCallback(
    (node: HTMLImageElement | null) => {
      imageRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [imageRef, ref],
  )

  const handleLoad = React.useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget
      registerImage({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })
      onLoad?.(event)
    },
    [registerImage, onLoad],
  )

  // Fetch the source as a Blob and decode it through createImageBitmap with
  // imageOrientation: "from-image" so the canvas export honours EXIF
  // orientation. <img> elements already display correctly in modern browsers
  // because image-orientation: from-image is the CSS default, but
  // ctx.drawImage(img) ignores EXIF on raw HTMLImageElement sources, so this
  // detour is what makes phone photos rasterise upright.
  React.useEffect(() => {
    if (!src) return
    if (typeof src !== "string") return
    if (typeof createImageBitmap !== "function") return
    if (typeof fetch !== "function") return
    let cancelled = false
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null
    ;(async () => {
      try {
        const response = await fetch(src, { signal: controller?.signal })
        if (!response.ok) return
        const blob = await response.blob()
        const bitmap = await createImageBitmap(blob, {
          imageOrientation: "from-image",
        })
        if (cancelled) {
          bitmap.close()
          return
        }
        setOrientedSource(bitmap)
      } catch {
        // Cross-origin / network / unsupported codec — fall back to the
        // <img> element, which the canvas pipeline uses by default.
      }
    })()
    return () => {
      cancelled = true
      controller?.abort()
      setOrientedSource(null)
    }
  }, [src, setOrientedSource])

  const flipX = flip.horizontal ? -1 : 1
  const flipY = flip.vertical ? -1 : 1
  const transform =
    `translate(${imagePosition.x}px, ${imagePosition.y}px) ` +
    `rotate(${rotation}deg) ` +
    `scale(${zoom * flipX}, ${zoom * flipY})`

  return (
    <img
      ref={composedRef}
      id={ids.image}
      src={src}
      className={cn("dr-image-cropper-image", className)}
      onLoad={handleLoad}
      style={{ transform, ...style }}
      draggable={false}
      {...rest}
    />
  )
}

function ImageCropperSelection({
  className,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  ref,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  const api = useImageCropperContext("ImageCropperSelection")
  const dragRef = React.useRef<DragState<{ startCrop: CropRect }> | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    if (ignorePointer(event)) return
    if (api.fixedCropArea) return
    // Don't start a selection drag when the user grabbed a handle — handles
    // stop propagation but data-position is the truth-of-purpose marker.
    const target = event.target as HTMLElement | null
    if (target?.closest("[data-position]")) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      data: { startCrop: api.crop },
    }
    api.setDragging(true)
    event.preventDefault()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    api.setCrop({
      ...drag.data.startCrop,
      x: drag.data.startCrop.x + dx,
      y: drag.data.startCrop.y + dy,
    })
  }

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      api.setDragging(false)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event)
    finishDrag(event)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event)
    finishDrag(event)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (api.fixedCropArea) return
    const step =
      event.ctrlKey || event.metaKey
        ? api.nudgeStepCtrl
        : event.shiftKey
          ? api.nudgeStepShift
          : api.nudgeStep
    let dx = 0
    let dy = 0
    if (event.key === "ArrowLeft") dx = -step
    else if (event.key === "ArrowRight") dx = step
    else if (event.key === "ArrowUp") dy = -step
    else if (event.key === "ArrowDown") dy = step
    else return
    event.preventDefault()
    api.setCrop({
      ...api.crop,
      x: api.crop.x + dx,
      y: api.crop.y + dy,
    })
  }

  return (
    <div
      ref={ref}
      id={api.ids.selection}
      role="region"
      aria-label={api.translations.selectionLabel}
      tabIndex={api.fixedCropArea ? -1 : 0}
      className={cn("dr-image-cropper-selection", className)}
      data-shape={api.cropShape}
      data-fixed={api.fixedCropArea ? "true" : undefined}
      data-dragging={api.isDragging ? "true" : undefined}
      style={{
        position: "absolute",
        left: api.crop.x,
        top: api.crop.y,
        width: api.crop.width,
        height: api.crop.height,
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  )
}

export interface ImageCropperHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  position: HandlePosition
  ref?: React.Ref<HTMLDivElement>
}

function ImageCropperHandle({
  position,
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ref,
  ...rest
}: ImageCropperHandleProps) {
  const api = useImageCropperContext("ImageCropperHandle")
  const dragRef = React.useRef<DragState<{ startCrop: CropRect }> | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    if (ignorePointer(event)) return
    if (api.fixedCropArea) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      data: { startCrop: api.crop },
    }
    api.setDragging(true)
    event.preventDefault()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    api.setCrop(
      resizeCrop(drag.data.startCrop, position, dx, dy, {
        aspectRatio: api.aspectRatio,
        minWidth: api.minWidth,
        maxWidth: api.maxWidth,
        minHeight: api.minHeight,
        maxHeight: api.maxHeight,
        viewport: api.viewport,
      }),
    )
  }

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      api.setDragging(false)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerUp?.(event)
    finishDrag(event)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    onPointerCancel?.(event)
    finishDrag(event)
  }

  return (
    <div
      ref={ref}
      id={api.ids.handle(position)}
      role="slider"
      aria-label={api.translations.handleLabel(position)}
      className={cn("dr-image-cropper-handle", className)}
      data-position={position}
      data-fixed={api.fixedCropArea ? "true" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      {...rest}
    />
  )
}

export interface ImageCropperGridProps extends React.HTMLAttributes<HTMLDivElement> {
  axis: GridAxis
  ref?: React.Ref<HTMLDivElement>
}

function ImageCropperGrid({
  axis,
  className,
  ref,
  ...rest
}: ImageCropperGridProps) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("dr-image-cropper-grid", className)}
      data-axis={axis}
      {...rest}
    />
  )
}

export interface ImageCropperDimensionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render even when no drag is in progress. Defaults to false: the badge
   *  fades in only while the user is interacting. */
  always?: boolean
  /** Customise the rendered text. Defaults to "{w} × {h}" rounded. */
  format?: (rect: CropRect) => React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}

function ImageCropperDimensions({
  className,
  always,
  format,
  ref,
  ...rest
}: ImageCropperDimensionsProps) {
  const api = useImageCropperContext("ImageCropperDimensions")
  const visible = always || api.isDragging
  if (!visible) return null
  const content = format
    ? format(api.crop)
    : `${Math.round(api.crop.width)} × ${Math.round(api.crop.height)}`
  return (
    <div
      ref={ref}
      aria-live="polite"
      className={cn("dr-image-cropper-dimensions", className)}
      data-state={api.isDragging ? "dragging" : "idle"}
      {...rest}
    >
      {content}
    </div>
  )
}

export type ImageCropperDropzoneProps = ImageDropzoneProps

/**
 * Cropper-flavoured wrapper around the generic ImageDropzone. Reads
 * translations from the surrounding ImageCropper / ImageCropperRootProvider
 * context when present so the `translations` prop on the cropper Root
 * cascades into the dropzone's ARIA labels and default child text. When
 * used standalone, falls back to English defaults via ImageDropzone.
 */
function ImageCropperDropzone({
  label,
  activeLabel,
  ...rest
}: ImageCropperDropzoneProps) {
  const ctx = React.useContext(ImageCropperContext)
  return (
    <ImageDropzone
      label={label ?? ctx?.translations.dropzoneLabel}
      activeLabel={activeLabel ?? ctx?.translations.dropzoneActiveLabel}
      {...rest}
    />
  )
}

export {
  ImageCropper,
  ImageCropperRootProvider,
  ImageCropperContextConsumer as ImageCropperContext,
  ImageCropperViewport,
  ImageCropperImage,
  ImageCropperSelection,
  ImageCropperHandle,
  ImageCropperGrid,
  ImageCropperDimensions,
  ImageCropperDropzone,
  useImageCropperContext,
}
