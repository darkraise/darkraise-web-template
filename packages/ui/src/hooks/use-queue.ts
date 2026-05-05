import { useCallback, useRef, useState } from "react"

export interface QueueResult<T> {
  add: (item: T) => void
  remove: () => T | undefined
  first: T | undefined
  last: T | undefined
  size: number
}

export function useQueue<T>(initial: T[] = []): QueueResult<T> {
  const [items, setItems] = useState<T[]>(initial)
  const queueRef = useRef<T[]>(initial)
  const add = useCallback((item: T) => {
    queueRef.current = [...queueRef.current, item]
    setItems(queueRef.current)
  }, [])
  const remove = useCallback((): T | undefined => {
    if (queueRef.current.length === 0) return undefined
    const head = queueRef.current[0]
    queueRef.current = queueRef.current.slice(1)
    setItems(queueRef.current)
    return head
  }, [])
  return {
    add,
    remove,
    first: items[0],
    last: items[items.length - 1],
    size: items.length,
  }
}
