import { useLayoutEffect, useRef, type RefObject } from "react"

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const sameBox = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) < 0.5 &&
  Math.abs(a.y - b.y) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5

/**
 * Moves one indicator element onto the nav's current row. A change of `key`
 * (the pathname) slides it there; anything that resizes the nav, such as a
 * group opening, the rail collapsing or a font loading, re-places it at once
 * so it never trails a layout change. `items` is the nav's data: a reorder
 * or replacement that leaves the pathname and the nav's size alone moves the
 * current row, and only a new `items` identity tells the hook to look again.
 */
export function useNavIndicator(
  navRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  key: string,
  items?: unknown,
): void {
  const placed = useRef(false)
  const lastKey = useRef(key)
  const last = useRef<Box | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) {
      // A nav that is not rendered (the stacked layout's aside off every
      // group) must not slide in from the corner when it comes back.
      placed.current = false
      last.current = null
      return
    }

    const place = (animate: boolean) => {
      const row = nav.querySelector<HTMLElement>(".dr-sidebar-nav-current")
      if (!row) {
        nav.dataset.indicator = "none"
        placed.current = false
        return
      }
      const navBox = nav.getBoundingClientRect()
      const rowBox = row.getBoundingClientRect()
      // The first placement has nowhere to slide from.
      const box: Box = {
        x: rowBox.left - navBox.left,
        y: rowBox.top - navBox.top,
        width: rowBox.width,
        height: rowBox.height,
      }
      // A re-render that moved nothing must not switch off a slide that is
      // still running. The numbers are compared rather than the inline
      // style, which reads back rounded to six significant digits.
      if (
        !animate &&
        nav.dataset.indicator === "ready" &&
        last.current &&
        sameBox(last.current, box)
      ) {
        return
      }
      indicator.dataset.animate = String(animate && placed.current)
      indicator.style.width = `${box.width}px`
      indicator.style.height = `${box.height}px`
      indicator.style.transform = `translate(${box.x}px, ${box.y}px)`
      indicator.style.setProperty("--indicator-x", `${box.x}px`)
      nav.dataset.indicator = "ready"
      placed.current = true
      last.current = box
    }

    const keyChanged = lastKey.current !== key
    lastKey.current = key
    place(keyChanged)
    if (typeof ResizeObserver === "undefined") return
    // An observer reports the nav's size as soon as it starts observing.
    // Re-placing on an unchanged size would cut the slide that just began,
    // but a changed one (a group that opened on the way in) must not be
    // missed, so the size is compared rather than the first call skipped.
    let { width, height } = nav.getBoundingClientRect()
    const observer = new ResizeObserver(() => {
      const box = nav.getBoundingClientRect()
      if (box.width === width && box.height === height) return
      width = box.width
      height = box.height
      place(false)
    })
    observer.observe(nav)
    return () => observer.disconnect()
  }, [navRef, indicatorRef, key, items])
}
