import { useMemo, useState } from "react"

export interface MapActions<K, V> {
  set: (key: K, value: V) => void
  delete: (key: K) => void
  clear: () => void
  reset: () => void
}

export function useMap<K, V>(
  initial: Iterable<readonly [K, V]> = [],
): readonly [ReadonlyMap<K, V>, MapActions<K, V>] {
  const initialEntries = useMemo(() => Array.from(initial), [initial])
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialEntries))
  const actions = useMemo<MapActions<K, V>>(
    () => ({
      set: (k, v) =>
        setMap((m) => {
          const n = new Map(m)
          n.set(k, v)
          return n
        }),
      delete: (k) =>
        setMap((m) => {
          const n = new Map(m)
          n.delete(k)
          return n
        }),
      clear: () => setMap(new Map()),
      reset: () => setMap(new Map(initialEntries)),
    }),
    [initialEntries],
  )
  return [map, actions] as const
}
