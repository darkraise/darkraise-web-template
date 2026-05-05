import type { RefObject } from "react"
import { useEffect } from "react"

const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not(:disabled):not([tabindex="-1"])',
  'input:not(:disabled):not([tabindex="-1"])',
  'select:not(:disabled):not([tabindex="-1"])',
  'textarea:not(:disabled):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",")

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active || !ref.current) return
    const root = ref.current
    const handler = (e: KeyboardEvent): void => {
      if (e.key !== "Tab") return
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null)
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      const activeEl = document.activeElement as HTMLElement | null
      if (e.shiftKey && activeEl === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }
    root.addEventListener("keydown", handler)
    return () => root.removeEventListener("keydown", handler)
  }, [ref, active])
}
