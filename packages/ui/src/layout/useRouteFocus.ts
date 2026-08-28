import { useEffect, useRef } from "react"

import { useRouterAdapter } from "@router"

export interface UseRouteFocusOptions {
  /** Element to focus after a navigation. Defaults to the layout's `<main>`. */
  targetId?: string
  enabled?: boolean
}

/**
 * Moves focus to the main content region after a route change.
 *
 * In a single-page app the document never reloads, so nothing resets the
 * user's position: a keyboard or screen reader user who follows a nav link
 * stays parked on that link, and the new page is announced to nobody. The
 * browser does this for free on a full page load; a client-side router has to
 * do it deliberately.
 *
 * Skips the first render — arriving on a page is not a navigation, and
 * stealing focus on load would fight the browser's own restoration.
 */
export function useRouteFocus({
  targetId = "main-content",
  enabled = true,
}: UseRouteFocusOptions = {}): void {
  const { usePathname } = useRouterAdapter()
  const pathname = usePathname()
  const previous = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      previous.current = pathname
      return
    }
    const isFirstRender = previous.current === null
    const changed = previous.current !== pathname
    previous.current = pathname
    if (isFirstRender || !changed) return

    const target = document.getElementById(targetId)
    if (!target) return

    // `<main>` is not focusable on its own. -1 makes it a focus destination
    // without adding a tab stop, which is the same trade the skip link makes.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
    target.focus()
  }, [pathname, targetId, enabled])
}
