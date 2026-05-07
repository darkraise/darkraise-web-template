import * as React from "react"
import { useEvent } from "../state/useEvent"
import { isTopLayer, popLayer, pushLayer } from "./layerStack"

export interface DismissableLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  onPointerDownOutside?: (event: PointerEvent) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onFocusOutside?: (event: FocusEvent) => void
  disableOutsidePointerEvents?: boolean
  children: React.ReactNode
}

export function DismissableLayer({
  onPointerDownOutside,
  onEscapeKeyDown,
  onFocusOutside,
  disableOutsidePointerEvents,
  children,
  ...rest
}: DismissableLayerProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const stableOutside = useEvent((e: PointerEvent) => onPointerDownOutside?.(e))
  const stableEscape = useEvent((e: KeyboardEvent) => onEscapeKeyDown?.(e))
  const stableFocusOutside = useEvent((e: FocusEvent) => onFocusOutside?.(e))

  React.useEffect(() => {
    const id = pushLayer(() => ref.current)
    const onPointerDown = (e: PointerEvent) => {
      const node = ref.current
      if (!node) return
      if (e.target instanceof Node && node.contains(e.target)) return
      stableOutside(e)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (!isTopLayer(id)) return
      stableEscape(e)
    }
    const onFocusIn = (e: FocusEvent) => {
      const node = ref.current
      if (!node) return
      if (e.target instanceof Node && node.contains(e.target)) return
      stableFocusOutside(e)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown, true)
    document.addEventListener("focusin", onFocusIn, true)
    return () => {
      popLayer(id)
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown, true)
      document.removeEventListener("focusin", onFocusIn, true)
    }
  }, [stableEscape, stableFocusOutside, stableOutside])

  React.useEffect(() => {
    if (!disableOutsidePointerEvents) return
    const previous = document.body.style.pointerEvents
    document.body.style.pointerEvents = "none"
    const node = ref.current
    if (node) node.style.pointerEvents = "auto"
    return () => {
      document.body.style.pointerEvents = previous
    }
  }, [disableOutsidePointerEvents])

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  )
}
