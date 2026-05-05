import { useEffect, useState } from "react"

export interface OrientationState {
  type: OrientationType | undefined
  angle: number
}

export function useScreenOrientation(): OrientationState {
  const read = (): OrientationState => {
    const o =
      typeof window !== "undefined" ? window.screen?.orientation : undefined
    return { type: o?.type, angle: o?.angle ?? 0 }
  }
  const [state, setState] = useState<OrientationState>(read)
  useEffect(() => {
    const o = window.screen?.orientation
    if (!o) return
    const handler = (): void => setState(read())
    o.addEventListener("change", handler)
    return () => o.removeEventListener("change", handler)
  }, [])
  return state
}
