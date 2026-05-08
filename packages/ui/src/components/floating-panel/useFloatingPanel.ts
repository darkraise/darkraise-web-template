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
}

interface DragState {
  type: "drag" | "resize"
  startPointer: Position
  startPosition: Position
  startSize: Size
  pointerId: number
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
        setPosition({
          x: drag.startPosition.x + dx,
          y: drag.startPosition.y + dy,
        })
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

  return { position, size, beginDrag, beginResize }
}
