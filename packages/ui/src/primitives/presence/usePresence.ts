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
  const [lingering, setLingering] = React.useState(present)

  // The state follows `present` in the same render, so the exit animation
  // is already running when the frame below reads getAnimations(). Set from
  // an effect, it landed a render late and lost that race: the check saw
  // only the finished enter animation and unmounted at once.
  React.useEffect(() => {
    if (present) {
      setLingering(true)
      return
    }
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      if (cancelled) return
      const node = ref.current
      if (!node) {
        setLingering(false)
        return
      }
      const animations = node.getAnimations?.() ?? []
      if (animations.length === 0) {
        setLingering(false)
        return
      }
      Promise.all(
        animations.map((a) => a.finished.catch(() => undefined)),
      ).then(() => {
        if (!cancelled) setLingering(false)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [present, ref])

  return {
    isPresent: present || lingering,
    state: present ? "open" : "closed",
  }
}
