import * as React from "react"

export type PresenceState = "open" | "closed"

export interface UsePresenceResult {
  isPresent: boolean
  state: PresenceState
}

export function usePresence(
  present: boolean,
  ref: React.RefObject<HTMLElement | null>,
): UsePresenceResult {
  const [state, setState] = React.useState<PresenceState>(
    present ? "open" : "closed",
  )
  const [isPresent, setIsPresent] = React.useState(present)

  React.useEffect(() => {
    if (present) {
      setState("open")
      setIsPresent(true)
      return
    }
    setState("closed")
    const node = ref.current
    if (!node) {
      setIsPresent(false)
      return
    }
    const animations = node.getAnimations?.() ?? []
    if (animations.length === 0) {
      setIsPresent(false)
      return
    }
    let cancelled = false
    Promise.all(animations.map((a) => a.finished.catch(() => undefined))).then(
      () => {
        if (!cancelled) setIsPresent(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [present, ref])

  return { isPresent, state }
}
