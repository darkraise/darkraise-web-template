import * as React from "react"
import { useSyncedRef } from "@hooks/useSyncedRef"
import { getTabbables } from "./tabbable"

export interface UseFocusTrapOptions {
  loop?: boolean
  disabled?: boolean
  initialFocus?:
    | React.RefObject<HTMLElement | null>
    | (() => HTMLElement | null)
    | null
  restoreFocus?: boolean
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {},
): void {
  const {
    loop = true,
    disabled = false,
    initialFocus = null,
    restoreFocus = true,
  } = options

  // Stash live values for `loop`, `initialFocus`, and `restoreFocus` so
  // the activation effect can read the latest without re-running.
  // Re-running the effect on those changes would re-snapshot
  // `previousActive` and re-steal focus mid-session, breaking the
  // restore-focus contract when the modal stays open across renders.
  const initialFocusRef = useSyncedRef(initialFocus)
  const loopRef = useSyncedRef(loop)
  const restoreFocusRef = useSyncedRef(restoreFocus)

  React.useEffect(() => {
    if (disabled) return
    const container = containerRef.current
    if (!container) return

    const previousActive =
      (document.activeElement as HTMLElement | null) ?? null

    const focusFirst = () => {
      const initial =
        typeof initialFocusRef.current === "function"
          ? initialFocusRef.current()
          : (initialFocusRef.current?.current ?? null)
      if (initial && container.contains(initial)) {
        initial.focus()
        return
      }
      const tabbables = getTabbables(container)
      tabbables[0]?.focus()
    }

    focusFirst()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return
      const tabbables = getTabbables(container)
      if (tabbables.length === 0) {
        event.preventDefault()
        return
      }
      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey && active === first) {
        if (loopRef.current) {
          event.preventDefault()
          last?.focus()
        }
      } else if (!event.shiftKey && active === last) {
        if (loopRef.current) {
          event.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      if (
        restoreFocusRef.current &&
        previousActive &&
        document.contains(previousActive)
      ) {
        previousActive.focus()
      }
    }
  }, [containerRef, disabled])
}
