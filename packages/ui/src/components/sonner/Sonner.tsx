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

interface ToasterProps {
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
  /** Sonner-compat placeholder; not implemented */
  theme?: "system" | "light" | "dark"
  /** Sonner-compat slot accepted but unused */
  className?: string
  style?: React.CSSProperties
  toastOptions?: unknown
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
}: ToasterProps) {
  const toasts = useToasts()
  if (toasts.length === 0 && typeof document === "undefined") return null
  return (
    <Portal>
      <ol
        className={cn("dr-toaster", className)}
        data-position={position}
        style={style}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
    </Portal>
  )
}
Toaster.displayName = "Toaster"

interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast: t }: ToastItemProps) {
  const [present, setPresent] = React.useState(true)

  const close = useEvent(() => {
    setPresent(false)
    // Let the exit animation play before removing from store.
    window.setTimeout(() => toast.dismiss(t.id), 200)
  })

  const duration = t.duration ?? DEFAULT_DURATION_BY_KIND[t.kind] ?? 4000

  React.useEffect(() => {
    if (!Number.isFinite(duration)) return
    const handle = window.setTimeout(close, duration)
    return () => window.clearTimeout(handle)
  }, [duration, close])

  // Announce to screen readers when the toast first mounts.
  React.useEffect(() => {
    const text =
      typeof t.message === "string"
        ? t.message
        : typeof t.description === "string"
          ? t.description
          : ""
    if (text) announce(text, t.kind === "error" ? "assertive" : "polite")
  }, [t.id, t.message, t.description, t.kind])

  // Swipe-to-dismiss on touch/pointer drag.
  const containerRef = React.useRef<HTMLLIElement | null>(null)
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
    node.style.transform = `translateX(${dx}px)`
    node.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 200))
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
    node.style.transform = ""
    node.style.opacity = ""
  }

  return (
    <Presence present={present}>
      <li
        ref={containerRef}
        role="status"
        aria-live={t.kind === "error" ? "assertive" : "polite"}
        className={cn("dr-toast", `dr-toast--${t.kind}`)}
        data-kind={t.kind}
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
