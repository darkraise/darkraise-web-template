import type { RefObject } from "react"
import { useEffect, useState } from "react"

const DEFAULT_THRESHOLD = [0]
const DEFAULT_ROOT_MARGIN = "0px"

type IntersectionEntryCallback = (entry: IntersectionObserverEntry) => void

type ObserverEntry = {
  observer: IntersectionObserver
  observe: (target: Element, callback: IntersectionEntryCallback) => void
  unobserve: (target: Element, callback: IntersectionEntryCallback) => void
}

const observers = new Map<Element | Document, Map<string, ObserverEntry>>()

const getObserverEntry = (options: IntersectionObserverInit): ObserverEntry => {
  const root = options.root ?? document

  let rootObservers = observers.get(root)

  if (!rootObservers) {
    rootObservers = new Map()
    observers.set(root, rootObservers)
  }

  const opt = JSON.stringify([options.rootMargin, options.threshold])

  let observerEntry = rootObservers.get(opt)

  if (!observerEntry) {
    const callbacks = new Map<Element, Set<IntersectionEntryCallback>>()

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const cbs = callbacks.get(entry.target)
        if (cbs === undefined || cbs.size === 0) {
          continue
        }

        for (const cb of cbs) {
          setTimeout(() => {
            cb(entry)
          }, 0)
        }
      }
    }, options)

    observerEntry = {
      observer,
      observe(target, callback) {
        let cbs = callbacks.get(target)

        if (!cbs) {
          cbs = new Set()
          callbacks.set(target, cbs)
          observer.observe(target)
        }

        cbs.add(callback)
      },
      unobserve(target, callback) {
        const cbs = callbacks.get(target)

        if (cbs) {
          cbs.delete(callback)

          if (cbs.size === 0) {
            callbacks.delete(target)
            observer.unobserve(target)

            if (callbacks.size === 0) {
              observer.disconnect()

              rootObservers.delete(opt)

              if (rootObservers.size === 0) {
                observers.delete(root)
              }
            }
          }
        }
      },
    }

    rootObservers.set(opt, observerEntry)
  }

  return observerEntry
}

export type UseIntersectionObserverOptions = {
  root?: RefObject<Element | Document | null> | Element | Document | null
  rootMargin?: string
  threshold?: number[]
}

export function useIntersectionObserver<T extends Element>(
  target: RefObject<T | null> | T | null,
  {
    threshold = DEFAULT_THRESHOLD,
    root: r,
    rootMargin = DEFAULT_ROOT_MARGIN,
  }: UseIntersectionObserverOptions = {},
): IntersectionObserverEntry | undefined {
  const [state, setState] = useState<IntersectionObserverEntry>()
  // Stable serialization avoids re-binding when the caller passes an inline
  // threshold array whose identity changes on every render.
  const thresholdKey = threshold.join("|")

  useEffect(() => {
    const tgt = target && "current" in target ? target.current : target
    if (!tgt) {
      return
    }

    let subscribed = true
    const observerEntry = getObserverEntry({
      root: r && "current" in r ? r.current : r,
      rootMargin,
      threshold,
    })

    const handler: IntersectionEntryCallback = (entry) => {
      if (subscribed) {
        setState(entry)
      }
    }

    observerEntry.observe(tgt, handler)

    return () => {
      subscribed = false
      observerEntry.unobserve(tgt, handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, r, rootMargin, thresholdKey])

  return state
}
