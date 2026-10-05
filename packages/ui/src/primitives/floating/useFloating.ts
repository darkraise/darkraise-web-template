import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating as useFloatingUI,
  type Placement,
  type UseFloatingOptions,
  type UseFloatingReturn,
} from "@floating-ui/react"
import * as React from "react"

export interface UseFloatingProps {
  placement?: Placement
  sideOffset?: number
  alignOffset?: number
  arrowPadding?: number
  collisionPadding?: number
  avoidCollisions?: boolean
  sticky?: "always" | "partial"
}

export interface UseFloatingReturnExtended extends UseFloatingReturn {
  arrowRef: (node: SVGSVGElement | null) => void
  arrowEl: SVGSVGElement | null
}

export function useFloating(
  props: UseFloatingProps = {},
): UseFloatingReturnExtended {
  const {
    placement = "bottom",
    sideOffset = 4,
    alignOffset = 0,
    arrowPadding = 4,
    collisionPadding = 8,
    avoidCollisions = true,
  } = props

  const [arrowEl, setArrowEl] = React.useState<SVGSVGElement | null>(null)

  const middleware = React.useMemo(
    () =>
      [
        offset({ mainAxis: sideOffset, crossAxis: alignOffset }),
        avoidCollisions ? flip({ padding: collisionPadding }) : undefined,
        avoidCollisions ? shift({ padding: collisionPadding }) : undefined,
        size({ padding: collisionPadding }),
        arrow({ element: arrowEl, padding: arrowPadding }),
      ].filter(Boolean) as NonNullable<UseFloatingOptions["middleware"]>,
    [
      alignOffset,
      arrowEl,
      arrowPadding,
      avoidCollisions,
      collisionPadding,
      sideOffset,
    ],
  )

  const floating = useFloatingUI({
    placement,
    middleware,
    whileElementsMounted: autoUpdate,
  })

  return {
    ...floating,
    arrowRef: setArrowEl,
    arrowEl,
  }
}
