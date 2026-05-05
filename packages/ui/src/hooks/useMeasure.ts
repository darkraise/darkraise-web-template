import type { RefObject } from "react"
import { useState } from "react"
import { useHookableRef } from "./useHookableRef"
import { useRafCallback } from "./useRafCallback"
import type { UseResizeObserverCallback } from "./useResizeObserver"
import { useResizeObserver } from "./useResizeObserver"

export type Measures = {
  width: number
  height: number
}

export function useMeasure<T extends Element>(
  enabled = true,
): [Measures | undefined, RefObject<T | null>] {
  const [element, setElement] = useState<T | null>(null)
  const elementRef = useHookableRef<T | null>(null, (v) => {
    setElement(v)

    return v
  })

  const [measures, setMeasures] = useState<Measures>()
  const [observerHandler] = useRafCallback<UseResizeObserverCallback>(
    (entry) => {
      setMeasures({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    },
  )

  useResizeObserver(element, observerHandler, enabled)

  return [measures, elementRef]
}
