import * as React from "react"
import {
  GripVertical,
  Maximize2,
  Minimize2,
  Minus,
  Pin,
  PinOff,
  Square,
  X,
} from "lucide-react"
import { cn } from "@lib/utils"
import { Portal } from "@primitives/portal"
import { useFloatingPanelStore } from "./FloatingPanelProvider"
import {
  useFloatingPanel,
  type UseFloatingPanelOptions,
} from "./useFloatingPanel"
import "./floating-panel.css"

interface FloatingPanelContextValue {
  beginDrag: (event: PointerEvent) => void
  beginResize: (event: PointerEvent) => void
  minimized: boolean
  maximized: boolean
  pinned: boolean
  toggleMinimized: () => void
  toggleMaximized: () => void
  togglePinned: () => void
  close: () => void
}

const Ctx = React.createContext<FloatingPanelContextValue | null>(null)
function useCtx(consumer: string) {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error(`${consumer} must be inside <FloatingPanel>`)
  return ctx
}

export interface FloatingPanelProps
  extends
    UseFloatingPanelOptions,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof UseFloatingPanelOptions> {
  /**
   * Positioning scope for the panel.
   *
   * - `"local"` (default): `position: absolute` — the panel anchors to its
   *   nearest positioned ancestor. Use this when the panel should stay
   *   within a card, dashboard cell, or workspace pane.
   * - `"global"`: `position: fixed` — the panel anchors to the viewport
   *   and stays put while the page scrolls. Use this for app-level
   *   floating tools (devtools panels, persistent inspectors).
   */
  scope?: "local" | "global"
}

export interface FloatingPanelAppProps<P extends Record<string, unknown>> {
  scope: "app"
  id: string
  component: React.ComponentType<P>
  componentProps: P
  persist?: boolean
  persistKey?: string
  defaultOpen?: boolean
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  defaultMinimized?: boolean
  defaultMaximized?: boolean
  defaultPinned?: boolean
}

// All panels — local and global — share a single z-index pool driven
// purely by activation order. A scope-aware Z_BASE was tried earlier
// (local at 50, global at 40) but the 10-unit tier offset dominated the
// activation slot, so a global panel opened *after* a local one still
// rendered behind it until enough drags accumulated slot value to bridge
// the gap. With a unified base of zero, the inline z-index is just the
// activation slot, so the most recently activated panel always wins
// regardless of scope.
//
// Slot 1 starts above page chrome (which has no explicit z-index ≈ 0).
// Modal-tier overlays at z-50 stay above panels until ~49 panels have
// been opened in a session — fine in practice.
const Z_BASE = 0

function FloatingPanelImpl({
  className,
  position,
  defaultPosition,
  onPositionChange,
  size,
  defaultSize,
  onSizeChange,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  open,
  defaultOpen,
  onOpenChange,
  minimized,
  defaultMinimized,
  onMinimizedChange,
  maximized,
  defaultMaximized,
  onMaximizedChange,
  pinned,
  defaultPinned,
  onPinnedChange,
  scope = "local",
  style,
  children,
  onPointerDown,
  ...rest
}: FloatingPanelProps) {
  // Ref to the panel root so the bounds resolver can walk to offsetParent
  // for local scope. Set by the JSX below via `composeRefs`-style assignment.
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  const getBounds = React.useCallback(() => {
    if (typeof window === "undefined") return null
    if (scope === "global") {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      }
    }
    const node = panelRef.current
    if (!node) return null
    // offsetParent is the nearest positioned ancestor — exactly the box the
    // panel's `position: absolute` is anchored to. clientWidth/Height ignore
    // scrollbars and borders, which is what we want as the drag bounds.
    const parent = node.offsetParent as HTMLElement | null
    if (!parent) return null
    return {
      width: parent.clientWidth,
      height: parent.clientHeight,
    }
  }, [scope])

  const machine = useFloatingPanel({
    position,
    defaultPosition,
    onPositionChange,
    size,
    defaultSize,
    onSizeChange,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    open,
    defaultOpen,
    onOpenChange,
    minimized,
    defaultMinimized,
    onMinimizedChange,
    maximized,
    defaultMaximized,
    onMaximizedChange,
    pinned,
    defaultPinned,
    onPinnedChange,
    getBounds,
  })

  const ctxValue = React.useMemo<FloatingPanelContextValue>(
    () => ({
      beginDrag: machine.beginDrag,
      beginResize: machine.beginResize,
      minimized: machine.minimized,
      maximized: machine.maximized,
      pinned: machine.pinned,
      toggleMinimized: machine.toggleMinimized,
      toggleMaximized: machine.toggleMaximized,
      togglePinned: machine.togglePinned,
      close: machine.close,
    }),
    [
      machine.beginDrag,
      machine.beginResize,
      machine.minimized,
      machine.maximized,
      machine.pinned,
      machine.toggleMinimized,
      machine.toggleMaximized,
      machine.togglePinned,
      machine.close,
    ],
  )

  if (!machine.open) return null

  // Skip inline position/size while maximised so the CSS `inset: 0` rule on
  // [data-maximized="true"] takes over without competing inline styles.
  // While minimised, keep position + width but drop height so the panel
  // shrinks to whatever the header measures — without needing !important.
  const layoutStyle: React.CSSProperties = machine.maximized
    ? {}
    : machine.minimized
      ? {
          left: machine.position.x,
          top: machine.position.y,
          width: machine.size.width,
        }
      : {
          left: machine.position.x,
          top: machine.position.y,
          width: machine.size.width,
          height: machine.size.height,
        }

  const tree = (
    <Ctx.Provider value={ctxValue}>
      <div
        ref={panelRef}
        className={cn("dr-floating-panel", className)}
        data-scope={scope}
        data-minimized={machine.minimized ? "true" : undefined}
        data-maximized={machine.maximized ? "true" : undefined}
        data-pinned={machine.pinned ? "true" : undefined}
        // zIndex first so consumer-provided style can still override it; the
        // component-managed layout keys (left/top/width/height) come last
        // because those are the component's responsibility, not the user's.
        style={{
          zIndex: Z_BASE + machine.zOrder,
          ...style,
          ...layoutStyle,
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (event.defaultPrevented) return
          machine.bringToFront()
        }}
        {...rest}
      >
        {children}
      </div>
    </Ctx.Provider>
  )

  // Global-scope panels portal to document.body to escape the host page's
  // stacking contexts. Without this, a panel mounted inside an ancestor
  // with `isolation: isolate` (the template's `<main data-content>` is one)
  // gets trapped in that atom — even `position: fixed` doesn't escape a
  // stacking context, only a containing block. Sibling stacking contexts
  // outside main (e.g. sidebar children with z-index: 1) would render
  // above the panel regardless of how high its z-index goes. Local panels
  // stay in place because their `position: absolute` is meant to anchor to
  // the parent card.
  return scope === "global" ? <Portal>{tree}</Portal> : tree
}

function FloatingPanel<P extends Record<string, unknown>>(
  props: FloatingPanelProps | FloatingPanelAppProps<P>,
) {
  if ((props as { scope?: string }).scope === "app") {
    return (
      <FloatingPanelAppRegistration {...(props as FloatingPanelAppProps<P>)} />
    )
  }
  return <FloatingPanelImpl {...(props as FloatingPanelProps)} />
}

function FloatingPanelAppRegistration<P extends Record<string, unknown>>(
  props: FloatingPanelAppProps<P>,
) {
  const store = useFloatingPanelStore()
  const {
    id,
    component,
    componentProps,
    persist,
    persistKey,
    defaultOpen,
    defaultPosition,
    defaultSize,
    defaultMinimized,
    defaultMaximized,
    defaultPinned,
  } = props

  const resolvedPersistKey =
    persistKey ?? (persist ? `dr-floating-panel:${id}` : undefined)

  React.useEffect(() => {
    store.register(id, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: component as React.ComponentType<any>,
      componentProps: componentProps as Record<string, unknown>,
      defaultOpen,
      defaultPosition,
      defaultSize,
      defaultMinimized,
      defaultMaximized,
      defaultPinned,
      persistKey: resolvedPersistKey ?? null,
    })
    // No cleanup — the panel survives unmount.
  }, [
    store,
    id,
    component,
    componentProps,
    defaultOpen,
    defaultPosition,
    defaultSize,
    defaultMinimized,
    defaultMaximized,
    defaultPinned,
    resolvedPersistKey,
  ])

  return null
}

function FloatingPanelHeader({
  className,
  onPointerDown,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = useCtx("FloatingPanelHeader")
  return (
    <div
      className={cn("dr-floating-panel-header", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        // A pinned panel can't be dragged — bail before touching the
        // pointer so a click on the header doesn't get redirected to it
        // via setPointerCapture.
        if (ctx.pinned) return
        // Skip drag init when the press lands on an interactive descendant
        // (minimize / maximize / close trigger). Capturing on the header
        // would redirect the resulting click to the header per the pointer-
        // events spec — same gotcha as the toast close button.
        if (
          event.target instanceof Element &&
          event.target.closest(
            "button, a, input, textarea, select, [role=button]",
          )
        ) {
          return
        }
        event.currentTarget.setPointerCapture?.(event.pointerId)
        ctx.beginDrag(event.nativeEvent)
      }}
      {...rest}
    />
  )
}

function FloatingPanelDragHandle({
  className,
  "aria-label": ariaLabel = "Drag to move",
  ...rest
}: Omit<React.HTMLAttributes<HTMLSpanElement>, "children">) {
  return (
    <span
      role="presentation"
      aria-label={ariaLabel}
      className={cn("dr-floating-panel-drag-handle", className)}
      {...rest}
    >
      <GripVertical aria-hidden="true" />
    </span>
  )
}

function FloatingPanelTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("dr-floating-panel-title", className)} {...rest} />
}

type FloatingPanelTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement>
  }

function FloatingPanelMinimizeTrigger({
  className,
  onClick,
  "aria-label": ariaLabel,
  children,
  ref,
  ...rest
}: FloatingPanelTriggerProps) {
  const ctx = useCtx("FloatingPanelMinimizeTrigger")
  const label = ariaLabel ?? (ctx.minimized ? "Restore" : "Minimize")
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      data-active={ctx.minimized ? "true" : undefined}
      className={cn("dr-floating-panel-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggleMinimized()
      }}
      {...rest}
    >
      {children ??
        (ctx.minimized ? (
          <Square aria-hidden="true" />
        ) : (
          <Minus aria-hidden="true" />
        ))}
    </button>
  )
}

function FloatingPanelMaximizeTrigger({
  className,
  onClick,
  "aria-label": ariaLabel,
  children,
  ref,
  ...rest
}: FloatingPanelTriggerProps) {
  const ctx = useCtx("FloatingPanelMaximizeTrigger")
  // Maximise has no meaning while the panel is collapsed to its header — Ark
  // UI hides the trigger in that state, and we mirror it. Returning null
  // also strips the button from the accessibility tree, so screen-reader
  // users don't see a maximise affordance that does nothing.
  if (ctx.minimized) return null
  const label = ariaLabel ?? (ctx.maximized ? "Restore" : "Maximize")
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      data-active={ctx.maximized ? "true" : undefined}
      className={cn("dr-floating-panel-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.toggleMaximized()
      }}
      {...rest}
    >
      {children ??
        (ctx.maximized ? (
          <Minimize2 aria-hidden="true" />
        ) : (
          <Maximize2 aria-hidden="true" />
        ))}
    </button>
  )
}

function FloatingPanelPinTrigger({
  className,
  onClick,
  "aria-label": ariaLabel,
  children,
  ref,
  ...rest
}: FloatingPanelTriggerProps) {
  const ctx = useCtx("FloatingPanelPinTrigger")
  const label = ariaLabel ?? (ctx.pinned ? "Unpin" : "Pin")
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={ctx.pinned}
      data-active={ctx.pinned ? "true" : undefined}
      className={cn("dr-floating-panel-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.togglePinned()
      }}
      {...rest}
    >
      {children ??
        (ctx.pinned ? (
          <PinOff aria-hidden="true" />
        ) : (
          <Pin aria-hidden="true" />
        ))}
    </button>
  )
}

function FloatingPanelCloseTrigger({
  className,
  onClick,
  "aria-label": ariaLabel = "Close",
  children,
  ref,
  ...rest
}: FloatingPanelTriggerProps) {
  const ctx = useCtx("FloatingPanelCloseTrigger")
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={cn("dr-floating-panel-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.close()
      }}
      {...rest}
    >
      {children ?? <X aria-hidden="true" />}
    </button>
  )
}

function FloatingPanelContent({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("dr-floating-panel-content", className)} {...rest} />
  )
}

type FloatingPanelResizeHandleProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>

function FloatingPanelResizeHandle({
  className,
  onPointerDown,
  "aria-label": ariaLabel = "Resize panel",
  ...rest
}: FloatingPanelResizeHandleProps) {
  const ctx = useCtx("FloatingPanelResizeHandle")
  // Pinned panels hide the resize handle entirely (via CSS) and ignore
  // any stray pointerdown, so the panel can't be resized while pinned.
  if (ctx.pinned) return null
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn("dr-floating-panel-resize", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        event.currentTarget.setPointerCapture?.(event.pointerId)
        ctx.beginResize(event.nativeEvent)
      }}
      {...rest}
    />
  )
}

export {
  FloatingPanel,
  FloatingPanelHeader,
  FloatingPanelDragHandle,
  FloatingPanelTitle,
  FloatingPanelContent,
  FloatingPanelMinimizeTrigger,
  FloatingPanelMaximizeTrigger,
  FloatingPanelPinTrigger,
  FloatingPanelCloseTrigger,
  FloatingPanelResizeHandle,
}
