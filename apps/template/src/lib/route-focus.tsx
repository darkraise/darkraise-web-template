import { useEffect, useRef } from "react"
import { useRouterState } from "@tanstack/react-router"

/**
 * Moves focus to the main content region after each client-side navigation so
 * keyboard and screen-reader users land on the new page instead of staying on
 * the activated nav link. Pairs with the layouts' `#main-content` landmark and
 * the skip-to-content link. Uses preventScroll so it never fights scroll
 * restoration, and skips the initial mount.
 */
export function RouteFocusManager() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    document.getElementById("main-content")?.focus({ preventScroll: true })
  }, [pathname])

  return null
}
