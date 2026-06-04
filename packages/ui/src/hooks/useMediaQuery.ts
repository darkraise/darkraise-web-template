import type { Dispatch } from "react"
import { useEffect, useState } from "react"
import { isBrowser } from "./util"

const queriesMap = new Map<
  string,
  {
    mql: MediaQueryList
    dispatchers: Set<Dispatch<boolean>>
    listener: () => void
  }
>()

type QueryStateSetter = (matches: boolean) => void

const createQueryEntry = (query: string) => {
  const mql = matchMedia(query)
  const dispatchers = new Set<QueryStateSetter>()
  const listener = () => {
    for (const d of dispatchers) {
      d(mql.matches)
    }
  }

  mql.addEventListener("change", listener, { passive: true })

  return {
    mql,
    dispatchers,
    listener,
  }
}

const querySubscribe = (query: string, setState: QueryStateSetter) => {
  let entry = queriesMap.get(query)

  if (!entry) {
    entry = createQueryEntry(query)
    queriesMap.set(query, entry)
  }

  entry.dispatchers.add(setState)
  setState(entry.mql.matches)
}

const queryUnsubscribe = (query: string, setState: QueryStateSetter): void => {
  const entry = queriesMap.get(query)

  if (entry) {
    const { mql, dispatchers, listener } = entry
    dispatchers.delete(setState)

    if (dispatchers.size === 0) {
      queriesMap.delete(query)
      mql.removeEventListener("change", listener)
    }
  }
}

export type UseMediaQueryOptions = {
  initializeWithValue?: boolean
}

export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {},
): boolean | undefined {
  let { initializeWithValue = true } = options

  if (!isBrowser) {
    initializeWithValue = false
  }

  const [state, setState] = useState<boolean | undefined>(() => {
    if (initializeWithValue) {
      // Snapshot the current match value synchronously without attaching a
      // listener here. The effect below calls `querySubscribe`, which
      // creates the queriesMap entry and registers the global `change`
      // listener exactly once per query. Registering inside this
      // initializer would leak a listener (and a queriesMap entry without
      // a dispatcher) if the component unmounts before the effect runs —
      // e.g. under Concurrent rendering or Suspense bailouts.
      const existing = queriesMap.get(query)
      return existing ? existing.mql.matches : matchMedia(query).matches
    }
  })

  useEffect(() => {
    querySubscribe(query, setState)

    return () => {
      queryUnsubscribe(query, setState)
    }
  }, [query])

  return state
}
