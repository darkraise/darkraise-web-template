export type Direction = "ltr" | "rtl"

export type InlineStep = "next" | "prev"

/** The element's computed inline direction; "ltr" when there is no element. */
export function getDirection(element: Element | null | undefined): Direction {
  if (!element) return "ltr"
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr"
}

/**
 * Maps a horizontal arrow key to a step along the reading order: ArrowRight
 * is "next" left-to-right and "prev" right-to-left. Any other key is null.
 */
export function inlineArrow(
  key: string,
  element: Element | null | undefined,
): InlineStep | null {
  if (key !== "ArrowRight" && key !== "ArrowLeft") return null
  const rightward = key === "ArrowRight"
  return rightward === (getDirection(element) === "ltr") ? "next" : "prev"
}
