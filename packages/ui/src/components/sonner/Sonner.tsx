"use client"

import * as React from "react"
import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
  X,
} from "lucide-react"

import { cn } from "@lib/utils"
import { announce } from "@primitives/aria"
import { Portal } from "@primitives/portal"
import { Presence } from "@primitives/presence"
import { useEvent } from "@primitives/state"
import { toast, toastStore, type Toast, type ToastKind } from "./toastStore"
import "./sonner.css"

export { toast }
export type { Toast, ToastKind } from "./toastStore"

const DEFAULT_DURATION_BY_KIND: Record<ToastKind, number> = {
  default: 4000,
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
  loading: Number.POSITIVE_INFINITY,
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  default: null,
  success: <CircleCheck className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  warning: <TriangleAlert className="h-4 w-4" />,
  error: <OctagonX className="h-4 w-4" />,
  loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
}

type ToastPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center"

interface ToasterProps {
  position?: ToastPosition
  /** Sonner-compat placeholder; not implemented */
  theme?: "system" | "light" | "dark"
  className?: string
  style?: React.CSSProperties
  /** Sonner-compat slot accepted but unused */
  toastOptions?: unknown
  /** Vertical gap between toasts in expanded mode (px). Default 14. */
  gap?: number
  /** Maximum number of toasts visible in collapsed stack. Default 3. */
  visibleToasts?: number
}

function useToasts(): Toast[] {
  return React.useSyncExternalStore(
    toastStore.subscribe,
    () => toastStore.getState().toasts,
    () => toastStore.getState().toasts,
  )
}

function Toaster({
  position = "bottom-right",
  className,
  style,
  gap = 14,
  visibleToasts = 3,
}: ToasterProps) {
  const toasts = useToasts()
  const [hoverExpanded, setHoverExpanded] = React.useState(false)
  const [focusExpanded, setFocusExpanded] = React.useState(false)
  const [heights, setHeights] = React.useState<Record<string, number>>({})

  const isTop = position.startsWith("top")

  // Newest toast at the END of the store array. Reverse so newest = index 0 = front.
  const ordered = React.useMemo(() => [...toasts].reverse(), [toasts])

  const reportHeight = React.useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }))
  }, [])

  const expandedOffsets = React.useMemo(() => {
    const map: Record<string, number> = {}
    let acc = 0
    for (const t of ordered) {
      map[t.id] = acc
      acc += (heights[t.id] ?? 0) + gap
    }
    return map
  }, [ordered, heights, gap])

  const totalExpandedHeight = ordered.reduce(
    (sum, t, i) => sum + (heights[t.id] ?? 0) + (i > 0 ? gap : 0),
    0,
  )

  const frontHeight =
    ordered.length > 0 ? (heights[ordered[0]?.id ?? ""] ?? 0) : 0

  const isExpanded = hoverExpanded || focusExpanded
  const toasterHeight = isExpanded ? totalExpandedHeight : frontHeight

  if (toasts.length === 0) {
    return null
  }

  return (
    <Portal>
      <ol
        className={cn("dr-toaster", className)}
        data-position={position}
        data-expanded={isExpanded ? "true" : undefined}
        style={
          {
            "--toaster-gap": `${gap}px`,
            "--toaster-height": `${toasterHeight}px`,
            ...style,
          } as React.CSSProperties
        }
        onPointerEnter={() => setHoverExpanded(true)}
        onPointerLeave={() => setHoverExpanded(false)}
        onFocusCapture={() => setFocusExpanded(true)}
        onBlurCapture={(event) => {
          const next = event.relatedTarget as Node | null
          if (!next || !event.currentTarget.contains(next)) {
            setFocusExpanded(false)
          }
        }}
      >
        {ordered.map((t, i) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={i}
            visibleCount={visibleToasts}
            expandedOffset={expandedOffsets[t.id] ?? 0}
            onMeasureHeight={reportHeight}
            isTop={isTop}
            paused={isExpanded}
          />
        ))}
      </ol>
    </Portal>
  )
}
Toaster.displayName = "Toaster"

interface ToastItemProps {
  toast: Toast
  index: number
  visibleCount: number
  expandedOffset: number
  onMeasureHeight: (id: string, h: number) => void
  isTop: boolean
  paused: boolean
}

function ToastItem({
  toast: t,
  index,
  visibleCount,
  expandedOffset,
  onMeasureHeight,
  isTop,
  paused,
}: ToastItemProps) {
  const [present, setPresent] = React.useState(true)
  const containerRef = React.useRef<HTMLLIElement | null>(null)

  const close = useEvent(() => {
    setPresent(false)
    window.setTimeout(() => toast.dismiss(t.id), 300)
  })

  const duration = t.duration ?? DEFAULT_DURATION_BY_KIND[t.kind] ?? 4000

  // Pause-aware auto-dismiss timer. Keeps remaining duration in a ref so
  // pausing (hover/focus expand) preserves the time already elapsed and
  // resumes from where it left off — matches sonner's behavior.
  const remainingRef = React.useRef(duration)
  const startedAtRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!Number.isFinite(remainingRef.current)) return
    if (paused) {
      if (startedAtRef.current !== null) {
        const elapsed = Date.now() - startedAtRef.current
        remainingRef.current = Math.max(0, remainingRef.current - elapsed)
        startedAtRef.current = null
      }
      return
    }
    if (remainingRef.current <= 0) {
      close()
      return
    }
    startedAtRef.current = Date.now()
    const handle = window.setTimeout(close, remainingRef.current)
    return () => {
      window.clearTimeout(handle)
    }
  }, [paused, close])

  React.useEffect(() => {
    const text =
      typeof t.message === "string"
        ? t.message
        : typeof t.description === "string"
          ? t.description
          : ""
    if (text) announce(text, t.kind === "error" ? "assertive" : "polite")
  }, [t.id, t.message, t.description, t.kind])

  // Measure height for stacking math. Use offsetHeight in BOTH the initial
  // sync read and the ResizeObserver callback so we always report the same
  // border-box height. ResizeObserver's `entry.contentRect.height` is the
  // content box (excludes padding + border); mixing it with offsetHeight
  // would silently shrink heights ~32 px on resize and cause overlap when
  // expanded mode positions toasts by accumulated offset.
  React.useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return
    onMeasureHeight(t.id, node.offsetHeight)
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      const current = containerRef.current
      if (!current) return
      onMeasureHeight(t.id, current.offsetHeight)
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [t.id, onMeasureHeight])

  // Swipe-to-dismiss.
  const dragRef = React.useRef<{ pointerId: number; startX: number } | null>(
    null,
  )
  const onPointerDown = (event: React.PointerEvent<HTMLLIElement>) => {
    const node = containerRef.current
    if (!node) return
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX }
    node.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const node = containerRef.current
    if (!node) return
    const dx = event.clientX - drag.startX
    node.style.setProperty("--toast-swipe-x", `${dx}px`)
    node.style.setProperty(
      "--toast-swipe-opacity",
      String(Math.max(0, 1 - Math.abs(dx) / 200)),
    )
  }
  const onPointerUp = (event: React.PointerEvent<HTMLLIElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    const node = containerRef.current
    if (!node) return
    try {
      node.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    const dx = event.clientX - drag.startX
    if (Math.abs(dx) > 80) {
      close()
      return
    }
    node.style.removeProperty("--toast-swipe-x")
    node.style.removeProperty("--toast-swipe-opacity")
  }

  const isHiddenInStack = index >= visibleCount

  return (
    <Presence present={present}>
      <li
        ref={containerRef}
        role="status"
        aria-live={t.kind === "error" ? "assertive" : "polite"}
        className={cn("dr-toast", `dr-toast--${t.kind}`)}
        data-kind={t.kind}
        data-front={index === 0 ? "true" : undefined}
        data-hidden={isHiddenInStack ? "true" : undefined}
        style={
          {
            "--toast-index": index,
            "--toast-expanded-offset": `${expandedOffset}px`,
            "--toast-y-sign": isTop ? 1 : -1,
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {t.custom ? (
          t.custom
        ) : (
          <>
            {ICONS[t.kind] && (
              <span className="dr-toast-icon" aria-hidden>
                {ICONS[t.kind]}
              </span>
            )}
            <div className="dr-toast-body">
              {t.message ? (
                <div className="dr-toast-title">{t.message}</div>
              ) : null}
              {t.description ? (
                <div className="dr-toast-description">{t.description}</div>
              ) : null}
              {(t.action || t.cancel) && (
                <div className="dr-toast-actions">
                  {t.cancel && (
                    <button
                      type="button"
                      className="dr-toast-cancel"
                      onClick={() => {
                        t.cancel?.onClick()
                        close()
                      }}
                    >
                      {t.cancel.label}
                    </button>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      className="dr-toast-action"
                      onClick={() => {
                        t.action?.onClick()
                        close()
                      }}
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="dr-toast-close"
              onClick={close}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </li>
    </Presence>
  )
}

export { Toaster }
