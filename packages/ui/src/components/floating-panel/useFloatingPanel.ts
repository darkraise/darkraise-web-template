import * as React from "react"
import { flushSync } from "react-dom"
import { useControllableState, useEvent } from "@primitives/state"

export interface Position {
  x: number
  y: number
}
export interface Size {
  width: number
  height: number
}

export interface UseFloatingPanelOptions {
  position?: Position
  defaultPosition?: Position
  onPositionChange?: (position: Position) => void
  size?: Size
  defaultSize?: Size
  onSizeChange?: (size: Size) => void
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  /**
   * Optional drag bounds. Called on every pointermove; the resulting rect
   * defines the area the panel must stay inside. Return `null` to disable
   * clamping. The component supplies this based on scope — viewport for
   * `global`, the panel's `offsetParent` for `local`.
   */
  getBounds?: () => { width: number; height: number } | null
  /**
   * Visibility — `false` hides the panel entirely. The component returns
   * null when closed. Defaults to true.
   */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Minimised — keeps only the header visible (content + resize handle hide).
   * Position is preserved; can still be dragged.
   */
  minimized?: boolean
  defaultMinimized?: boolean
  onMinimizedChange?: (minimized: boolean) => void
  /**
   * Maximised — fills its positioned ancestor (`inset: 0`). Inline position /
   * size are skipped while maximised so the original values are restored on
   * unmaximise without any snapshot bookkeeping.
   */
  maximized?: boolean
  defaultMaximized?: boolean
  onMaximizedChange?: (maximized: boolean) => void
  /**
   * Pinned — locks the panel at its current position and size. While pinned,
   * `beginDrag` and `beginResize` are no-ops so the drag handle and resize
   * handle can't initiate a gesture. Programmatic position / size changes
   * (via controlled props) still apply, and minimise / maximise still work
   * — pin only prevents the user from moving or resizing the panel.
   */
  pinned?: boolean
  defaultPinned?: boolean
  onPinnedChange?: (pinned: boolean) => void
}

interface DragState {
  type: "drag" | "resize"
  startPointer: Position
  startPosition: Position
  startSize: Size
  pointerId: number
}

// Monotonic counter shared across all FloatingPanel instances. Each panel
// reserves a slot at mount and can advance to a fresh (higher) slot via
// `bringToFront`. The slot is added to the scope's z-index base in the
// component, so a later-opened or just-clicked panel always stacks above
// earlier ones — matches OS window-manager / browser-window UX. Slots are
// counted, not capped: in practice you'll never have enough panels open to
// breach the next tier, and the order is what matters, not the absolute
// value.
let panelActivationCounter = 0
function nextPanelActivation(): number {
  panelActivationCounter += 1
  return panelActivationCounter
}

export function useFloatingPanel(options: UseFloatingPanelOptions) {
  const [position, setPosition] = useControllableState<Position>({
    value: options.position,
    defaultValue: options.defaultPosition ?? { x: 0, y: 0 },
    onChange: options.onPositionChange,
  })
  const [size, setSize] = useControllableState<Size>({
    value: options.size,
    defaultValue: options.defaultSize ?? { width: 320, height: 240 },
    onChange: options.onSizeChange,
  })
  const [open, setOpen] = useControllableState<boolean>({
    value: options.open,
    defaultValue: options.defaultOpen ?? true,
    onChange: options.onOpenChange,
  })
  const [minimized, setMinimized] = useControllableState<boolean>({
    value: options.minimized,
    defaultValue: options.defaultMinimized ?? false,
    onChange: options.onMinimizedChange,
  })
  const [maximized, setMaximized] = useControllableState<boolean>({
    value: options.maximized,
    defaultValue: options.defaultMaximized ?? false,
    onChange: options.onMaximizedChange,
  })
  const [pinned, setPinned] = useControllableState<boolean>({
    value: options.pinned,
    defaultValue: options.defaultPinned ?? false,
    onChange: options.onPinnedChange,
  })
  const minW = options.minWidth ?? 80
  const minH = options.minHeight ?? 60
  const maxW = options.maxWidth ?? Number.POSITIVE_INFINITY
  const maxH = options.maxHeight ?? Number.POSITIVE_INFINITY

  const dragRef = React.useRef<DragState | null>(null)
  // Hold the latest listener refs in a ref pair so beginDrag/beginResize and
  // onUp can detach the exact same identities they attached, regardless of
  // how many renders have happened in between.
  const listenersRef = React.useRef<{
    move: (event: PointerEvent) => void
    up: (event: PointerEvent) => void
  } | null>(null)

  const onMove = useEvent((event: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    if (event.pointerId !== drag.pointerId) return
    const dx = event.clientX - drag.startPointer.x
    const dy = event.clientY - drag.startPointer.y
    // flushSync keeps the DOM in lockstep with the pointer so consumers
    // observing position/size mid-drag (and tests asserting style after a
    // dispatched event) see the updated values synchronously.
    flushSync(() => {
      if (drag.type === "drag") {
        let nextX = drag.startPosition.x + dx
        let nextY = drag.startPosition.y + dy
        // Clamp so the panel can't be dragged off-screen. Bounds come from
        // the component (viewport for global scope, offsetParent for local).
        // Use the *current* size (not startSize) in case the panel was
        // resized between activation and drag — shouldn't be possible in
        // the same gesture, but is a defensive choice.
        const bounds = options.getBounds?.()
        if (bounds) {
          const maxX = bounds.width - size.width
          const maxY = bounds.height - size.height
          nextX = maxX < 0 ? 0 : Math.max(0, Math.min(maxX, nextX))
          nextY = maxY < 0 ? 0 : Math.max(0, Math.min(maxY, nextY))
        }
        setPosition({ x: nextX, y: nextY })
      } else {
        setSize({
          width: Math.min(maxW, Math.max(minW, drag.startSize.width + dx)),
          height: Math.min(maxH, Math.max(minH, drag.startSize.height + dy)),
        })
      }
    })
  })

  const detach = useEvent(() => {
    const listeners = listenersRef.current
    if (!listeners) return
    window.removeEventListener("pointermove", listeners.move)
    window.removeEventListener("pointerup", listeners.up)
    window.removeEventListener("pointercancel", listeners.up)
    listenersRef.current = null
  })

  const onUp = useEvent((event: PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    if (event.pointerId !== drag.pointerId) return
    dragRef.current = null
    detach()
  })

  const attach = useEvent(() => {
    detach()
    listenersRef.current = { move: onMove, up: onUp }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  })

  const beginDrag = useEvent((event: PointerEvent) => {
    // Pin locks the panel in place: a pinned panel ignores drag init so the
    // header handle becomes inert. Programmatic position changes still
    // apply via controlled props.
    if (pinned) return
    dragRef.current = {
      type: "drag",
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: position,
      startSize: size,
      pointerId: event.pointerId,
    }
    attach()
  })

  const beginResize = useEvent((event: PointerEvent) => {
    // Pin also blocks user resizing — the resize handle still mounts so
    // CSS can hide it visually, but a stray press doesn't start a gesture.
    if (pinned) return
    dragRef.current = {
      type: "resize",
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition: position,
      startSize: size,
      pointerId: event.pointerId,
    }
    attach()
  })

  React.useEffect(() => detach, [detach])

  // Activation slot — reserved at mount so each panel starts above the
  // previously-opened one. `bringToFront` advances to a fresh slot when the
  // user interacts with this panel.
  const [zOrder, setZOrder] = React.useState(() => nextPanelActivation())
  const bringToFront = useEvent(() => {
    setZOrder(nextPanelActivation())
  })

  const close = useEvent(() => setOpen(false))
  const toggleMinimized = useEvent(() => {
    // Coming out of minimised while maximised would be a contradiction; keep
    // the panel maximised. Going into minimised cancels maximised so the
    // header isn't viewport-wide while collapsed.
    if (!minimized && maximized) setMaximized(false)
    setMinimized(!minimized)
  })
  const toggleMaximized = useEvent(() => {
    if (!maximized && minimized) setMinimized(false)
    setMaximized(!maximized)
  })
  const togglePinned = useEvent(() => setPinned(!pinned))

  return {
    position,
    size,
    open,
    minimized,
    maximized,
    pinned,
    zOrder,
    beginDrag,
    beginResize,
    setOpen,
    setMinimized,
    setMaximized,
    setPinned,
    close,
    toggleMinimized,
    toggleMaximized,
    togglePinned,
    bringToFront,
  }
}
