import * as React from "react"

type Ref<T> =
  | React.RefCallback<T>
  | React.RefObject<T | null>
  | null
  | undefined

export function composeRefs<T>(...refs: Array<Ref<T>>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") {
        ref(node)
      } else {
        ;(ref as { current: T | null }).current = node
      }
    }
  }
}

/**
 * `composeRefs` memoised on its refs. A new callback on every render makes
 * React detach the old one with `null` and attach the new one, which re-runs
 * state setters and consumer callback refs on each render.
 */
export function useComposedRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => composeRefs(...refs), refs)
}
