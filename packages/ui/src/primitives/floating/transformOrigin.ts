import type { Middleware, Placement } from "@floating-ui/react"

type Side = "top" | "right" | "bottom" | "left"
type Align = "start" | "center" | "end"

const ALIGN_PERCENT: Record<Align, string> = {
  start: "0%",
  center: "50%",
  end: "100%",
}

export interface ArrowBox {
  x?: number
  y?: number
  width: number
  height: number
}

/**
 * The point a popup scales from: its edge facing the anchor, at the
 * alignment it opened with or at the arrow. Under right-to-left floating-ui
 * places `start` on the right for top and bottom placements, so the
 * percentage mirrors with it.
 */
export function transformOriginFor(
  placement: Placement,
  rtl: boolean,
  arrow?: ArrowBox,
): string {
  const [side, align = "center"] = placement.split("-") as [Side, Align?]
  const vertical = side === "top" || side === "bottom"
  let along: string
  if (vertical && arrow?.x != null) {
    along = `${arrow.x + arrow.width / 2}px`
  } else if (!vertical && arrow?.y != null) {
    along = `${arrow.y + arrow.height / 2}px`
  } else {
    const mirrored =
      vertical && rtl && align !== "center"
        ? align === "start"
          ? "end"
          : "start"
        : align
    along = ALIGN_PERCENT[mirrored]
  }
  switch (side) {
    case "top":
      return `${along} 100%`
    case "bottom":
      return `${along} 0%`
    case "left":
      return `100% ${along}`
    case "right":
      return `0% ${along}`
  }
}

export function transformOrigin(arrowEl: Element | null): Middleware {
  return {
    name: "transformOrigin",
    async fn({ placement, elements, middlewareData, platform }) {
      const rtl = (await platform.isRTL?.(elements.floating)) ?? false
      const box = arrowEl?.getBoundingClientRect()
      const arrow =
        middlewareData.arrow && box
          ? {
              x: middlewareData.arrow.x,
              y: middlewareData.arrow.y,
              width: box.width,
              height: box.height,
            }
          : undefined
      elements.floating.style.setProperty(
        "--popup-transform-origin",
        transformOriginFor(placement, rtl, arrow),
      )
      return {}
    },
  }
}
