import { useMemo, useState } from "react"

export interface SetActions<T> {
  add: (value: T) => void
  delete: (value: T) => void
  toggle: (value: T) => void
  clear: () => void
  reset: () => void
}

export function useSet<T>(
  initial: Iterable<T> = [],
): readonly [ReadonlySet<T>, SetActions<T>] {
  const initialItems = useMemo(() => Array.from(initial), [initial])
  const [set, setSet] = useState<Set<T>>(() => new Set(initialItems))
  const actions = useMemo<SetActions<T>>(
    () => ({
      add: (v) =>
        setSet((s) => {
          const n = new Set(s)
          n.add(v)
          return n
        }),
      delete: (v) =>
        setSet((s) => {
          const n = new Set(s)
          n.delete(v)
          return n
        }),
      toggle: (v) =>
        setSet((s) => {
          const n = new Set(s)
          if (n.has(v)) n.delete(v)
          else n.add(v)
          return n
        }),
      clear: () => setSet(new Set()),
      reset: () => setSet(new Set(initialItems)),
    }),
    [initialItems],
  )
  return [set, actions] as const
}
