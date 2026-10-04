import { useLayoutEffect, useRef, type RefObject } from "react"

/**
 * Moves one indicator element onto the nav's current row. A change of `key`
 * (the pathname) slides it there; anything that resizes the nav, such as a
 * group opening, the rail collapsing or a font loading, re-places it at once
 * so it never trails a layout change.
 */
export function useNavIndicator(
  navRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  key: string,
): void {
  const placed = useRef(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) {
      // A nav that is not rendered (the stacked layout's aside off every
      // group) must not slide in from the corner when it comes back.
      placed.current = false
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
      const x = rowBox.left - navBox.left
      indicator.dataset.animate = String(animate && placed.current)
      indicator.style.width = `${rowBox.width}px`
      indicator.style.height = `${rowBox.height}px`
      indicator.style.transform = `translate(${x}px, ${rowBox.top - navBox.top}px)`
      indicator.style.setProperty("--indicator-x", `${x}px`)
      nav.dataset.indicator = "ready"
      placed.current = true
    }

    place(true)
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
  }, [navRef, indicatorRef, key])
}
