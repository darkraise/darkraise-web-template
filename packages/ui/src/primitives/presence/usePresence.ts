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
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
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
      Promise.all(
        animations.map((a) => a.finished.catch(() => undefined)),
      ).then(() => {
        if (!cancelled) setIsPresent(false)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [present, ref])

  return { isPresent, state }
}
