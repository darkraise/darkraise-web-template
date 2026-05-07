import type * as React from "react"

export interface UseAspectRatioOptions {
  ratio?: number
}

export interface UseAspectRatioReturn {
  wrapperStyle: React.CSSProperties
  contentStyle: React.CSSProperties
}

export function useAspectRatio(
  options: UseAspectRatioOptions = {},
): UseAspectRatioReturn {
  const { ratio = 1 } = options
  return {
    wrapperStyle: {
      position: "relative",
      width: "100%",
      paddingBottom: `${100 / ratio}%`,
    },
    contentStyle: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }
}
