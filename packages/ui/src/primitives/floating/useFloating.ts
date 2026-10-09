import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating as useFloatingUI,
  type Placement,
  type Strategy,
  type UseFloatingOptions,
  type UseFloatingReturn,
} from "@floating-ui/react"
import { transformOrigin } from "./transformOrigin"
import * as React from "react"

export interface UseFloatingProps {
  placement?: Placement
  /** `fixed` keeps the popup in place over a scrolling page. */
  strategy?: Strategy
  sideOffset?: number
  alignOffset?: number
  arrowPadding?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  sticky?: "always" | "partial"
  /** Lets Floating UI reset `isPositioned` when the popup closes. */
  open?: boolean
}

export interface UseFloatingReturnExtended extends UseFloatingReturn {
  arrowRef: (node: SVGSVGElement | null) => void
  arrowEl: SVGSVGElement | null
  /** A mounted arrow publishes how far it reaches past the popup's edge,
   *  which the side offset adds. */
  setArrowReach: (reach: number) => void
}

export function useFloating(
  props: UseFloatingProps = {},
): UseFloatingReturnExtended {
  const {
    placement = "bottom",
    strategy = "absolute",
    sideOffset = 4,
    alignOffset = 0,
    arrowPadding = 4,
    collisionPadding = 8,
    avoidCollisions = true,
    open,
  } = props

  const [arrowEl, setArrowEl] = React.useState<SVGSVGElement | null>(null)
  const [arrowReach, setArrowReach] = React.useState(0)

  const middleware = React.useMemo(
    () =>
      [
        offset({ mainAxis: sideOffset + arrowReach, crossAxis: alignOffset }),
        avoidCollisions ? flip({ padding: collisionPadding }) : undefined,
        avoidCollisions ? shift({ padding: collisionPadding }) : undefined,
        // Written inline so the popup's own stylesheet can cap its height to
        // the room left on its side and match its anchor's width.
        size({
          padding: collisionPadding,
          apply({ availableWidth, availableHeight, elements, rects }) {
            const style = elements.floating.style
            style.setProperty(
              "--popup-available-width",
              `${Math.max(0, availableWidth)}px`,
            )
            style.setProperty(
              "--popup-available-height",
              `${Math.max(0, availableHeight)}px`,
            )
            style.setProperty(
              "--popup-anchor-width",
              `${rects.reference.width}px`,
            )
            style.setProperty(
              "--popup-anchor-height",
              `${rects.reference.height}px`,
            )
          },
        }),
        arrow({ element: arrowEl, padding: arrowPadding }),
        transformOrigin(arrowEl),
      ].filter(Boolean) as NonNullable<UseFloatingOptions["middleware"]>,
    [
      alignOffset,
      arrowEl,
      arrowReach,
      arrowPadding,
      avoidCollisions,
      collisionPadding,
      sideOffset,
    ],
  )

  const floating = useFloatingUI({
    placement,
    strategy,
    middleware,
    whileElementsMounted: autoUpdate,
    open,
  })

  return {
    ...floating,
    arrowRef: setArrowEl,
    arrowEl,
    setArrowReach,
  }
}
