import { useUiLabels } from "../labels/useUiLabels"
import type { UiTextKey } from "./controlMessages"
import { useCallback } from "react"

export function useUiText() {
  const { controls } = useUiLabels()
  return useCallback(
    (key: string): string => controls[key as UiTextKey] ?? key,
    [controls],
  )
}
