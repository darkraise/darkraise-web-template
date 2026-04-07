import { useEffect } from "react"
import { useFirstMountState } from "./use-first-mount-state"
import { useMountEffect } from "./use-mount-effect"
import { useRafState } from "./use-raf-state"
import { isBrowser } from "./util"

export type WindowSize = {
  width: number
  height: number
}

const listeners = new Set<(size: WindowSize) => void>()

const callAllListeners = () => {
  for (const l of listeners) {
    l({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }
}

export function useWindowSize(
  stateHook = useRafState,
  measureOnMount?: boolean,
): WindowSize {
  const isFirstMount = useFirstMountState()
  const [size, setSize] = stateHook<WindowSize>({
    width: isFirstMount && isBrowser && !measureOnMount ? window.innerWidth : 0,
    height:
      isFirstMount && isBrowser && !measureOnMount ? window.innerHeight : 0,
  })

  useMountEffect(() => {
    if (measureOnMount) {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  })

  useEffect(() => {
    if (listeners.size === 0) {
      window.addEventListener("resize", callAllListeners, { passive: true })
    }

    listeners.add(setSize)

    return () => {
      listeners.delete(setSize)

      if (listeners.size === 0) {
        window.removeEventListener("resize", callAllListeners)
      }
    }
  }, [setSize])

  return size
}
