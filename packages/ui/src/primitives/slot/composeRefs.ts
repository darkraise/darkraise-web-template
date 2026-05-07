import type * as React from "react"

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
