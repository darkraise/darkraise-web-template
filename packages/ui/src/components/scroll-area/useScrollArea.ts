"use client"

import * as React from "react"

export interface UseScrollAreaReturn {
  viewportRef: React.RefObject<HTMLDivElement | null>
  metricsNonce: number
  bumpMetrics: () => void
}

export function useScrollArea(): UseScrollAreaReturn {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [metricsNonce, setMetricsNonce] = React.useState(0)
  const bumpMetrics = React.useCallback(() => {
    setMetricsNonce((n) => n + 1)
  }, [])
  return { viewportRef, metricsNonce, bumpMetrics }
}
