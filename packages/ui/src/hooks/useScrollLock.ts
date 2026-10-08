import { useEffect } from "react"
import { lockScroll, unlockScroll } from "@components/dialog/scrollLock"

/**
 * Locks page scroll while `active`, through the same stack as Dialog and
 * Drawer: the body takes the scrollbar width as padding, and the page is
 * restored only when the last lock is released.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const token = lockScroll()
    return () => unlockScroll(token)
  }, [active])
}
