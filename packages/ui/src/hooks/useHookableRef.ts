import type { RefObject } from "react"
import { useMemo } from "react"
import { useSyncedRef } from "./useSyncedRef"

export type HookableRefHandler<T> = (v: T) => T

export function useHookableRef<T>(
  initialValue: T,
  onSet?: HookableRefHandler<T>,
  onGet?: HookableRefHandler<T>,
): RefObject<T>
export function useHookableRef<T = undefined>(): RefObject<T | null | undefined>

export function useHookableRef<T>(
  initialValue?: T,
  onSet?: HookableRefHandler<T>,
  onGet?: HookableRefHandler<T>,
): RefObject<T | null | undefined> {
  const onSetRef = useSyncedRef(onSet)
  const onGetRef = useSyncedRef(onGet)

  return useMemo(() => {
    let v = initialValue

    return {
      get current() {
        return onGetRef.current === undefined ? v : onGetRef.current(v as T)
      },

      set current(value) {
        v =
          onSetRef.current === undefined ? value : onSetRef.current(value as T)
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
