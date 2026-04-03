import { useMemo } from "react"

export function useChartColors(): string[] {
  return useMemo(() => {
    const root = getComputedStyle(document.documentElement)
    return [1, 2, 3, 4, 5].map((i) => {
      const hsl = root.getPropertyValue(`--chart-${i}`).trim()
      return `hsl(${hsl})`
    })
  }, [])
}
