import type { DependencyList, EffectCallback } from "react"
import { useEffect } from "react"
import { useFirstMountState } from "./use-first-mount-state"
import { noop } from "./util"

export function useUpdateEffect(
  effect: EffectCallback,
  deps?: DependencyList,
): void {
  const isFirstMount = useFirstMountState()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(isFirstMount ? noop : effect, deps)
}
