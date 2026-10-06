import { useEffect, type RefObject } from "react"
import { getDirection } from "@lib/direction"

const TOLERANCE_PX = 1

function setFlag(element: HTMLElement, name: string, on: boolean) {
  if (on) element.setAttribute(name, "")
  else element.removeAttribute(name)
}

/**
 * Marks a horizontal scroller with `data-overflow-start` and
 * `data-overflow-end` while content lies beyond that inline edge. The
 * attributes are written directly so scrolling never re-renders the table.
 */
export function useScrollEdges(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    const element = ref.current
    if (!enabled || !element) return

    let rtl = getDirection(element) === "rtl"
    const update = () => {
      const hidden = element.scrollWidth - element.clientWidth
      // Under RTL, scrollLeft is 0 at the start edge and negative past it.
      const scrolled = rtl ? -element.scrollLeft : element.scrollLeft
      setFlag(element, "data-overflow-start", scrolled > TOLERANCE_PX)
      setFlag(element, "data-overflow-end", hidden - scrolled > TOLERANCE_PX)
    }

    update()
    element.addEventListener("scroll", update, { passive: true })
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        rtl = getDirection(element) === "rtl"
        update()
      })
      observer.observe(element)
      // A virtualized viewport wraps a full-width wrapper around its table,
      // so the table is the box whose width tracks the columns.
      const content =
        element.querySelector("table") ?? element.firstElementChild
      if (content) observer.observe(content)
    }

    return () => {
      element.removeEventListener("scroll", update)
      observer?.disconnect()
      element.removeAttribute("data-overflow-start")
      element.removeAttribute("data-overflow-end")
    }
  }, [ref, enabled])
}
