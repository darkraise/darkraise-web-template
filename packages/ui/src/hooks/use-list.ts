import type { SetStateAction } from "react"
import { useMemo, useRef } from "react"
import { useRerender } from "./use-rerender"
import { useSyncedRef } from "./use-synced-ref"
import type { InitialState } from "./util"
import { resolveHookState } from "./util"

export type ListActions<T> = {
  set: (newList: SetStateAction<T[]>) => void
  push: (...items: T[]) => void
  updateAt: (index: number, newItem: T) => void
  insertAt: (index: number, item: T) => void
  update: (
    predicate: (iteratedItem: T, newItem: T) => boolean,
    newItem: T,
  ) => void
  updateFirst: (
    predicate: (iteratedItem: T, newItem: T) => boolean,
    newItem: T,
  ) => void
  upsert: (
    predicate: (iteratedItem: T, newItem: T) => boolean,
    newItem: T,
  ) => void
  sort: (compareFn?: (a: T, b: T) => number) => void
  filter: (
    callbackFn: (value: T, index?: number, array?: T[]) => boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ) => void
  removeAt: (index: number) => void
  clear: () => void
  reset: () => void
}

export function useList<T>(
  initialList: InitialState<T[]>,
): [T[], ListActions<T>] {
  const initial = useSyncedRef(initialList)
  const list = useRef(resolveHookState(initial.current))
  const rerender = useRerender()

  const actions = useMemo(
    () => ({
      set(newList: SetStateAction<T[]>) {
        list.current = resolveHookState(newList, list.current)
        rerender()
      },

      push(...items: T[]) {
        actions.set((currentList: T[]) => [...currentList, ...items])
      },

      updateAt(index: number, newItem: T) {
        actions.set((currentList: T[]) => {
          const listCopy = [...currentList]
          listCopy[index] = newItem
          return listCopy
        })
      },

      insertAt(index: number, newItem: T) {
        actions.set((currentList: T[]) => {
          const listCopy = [...currentList]

          if (index >= listCopy.length) {
            listCopy[index] = newItem
          } else {
            listCopy.splice(index, 0, newItem)
          }

          return listCopy
        })
      },

      update(predicate: (iteratedItem: T, newItem: T) => boolean, newItem: T) {
        actions.set((currentList: T[]) =>
          currentList.map((item: T) =>
            predicate(item, newItem) ? newItem : item,
          ),
        )
      },

      updateFirst(
        predicate: (iteratedItem: T, newItem: T) => boolean,
        newItem: T,
      ) {
        const indexOfMatch = list.current.findIndex((item: T) =>
          predicate(item, newItem),
        )
        const NO_MATCH = -1
        if (indexOfMatch > NO_MATCH) {
          actions.updateAt(indexOfMatch, newItem)
        }
      },

      upsert(predicate: (iteratedItem: T, newItem: T) => boolean, newItem: T) {
        const indexOfMatch = list.current.findIndex((item: T) =>
          predicate(item, newItem),
        )
        const NO_MATCH = -1
        if (indexOfMatch > NO_MATCH) {
          actions.updateAt(indexOfMatch, newItem)
        } else {
          actions.push(newItem)
        }
      },

      sort(compareFn?: (a: T, b: T) => number) {
        actions.set((currentList: T[]) => [...currentList].sort(compareFn))
      },

      filter(
        callbackFn: (value: T, index: number, array: T[]) => boolean,
        thisArg?: never,
      ) {
        actions.set((currentList: T[]) =>
          [...currentList].filter(callbackFn, thisArg),
        )
      },

      removeAt(index: number) {
        actions.set((currentList: T[]) => {
          const listCopy = [...currentList]
          if (index < listCopy.length) {
            listCopy.splice(index, 1)
          }
          return listCopy
        })
      },

      clear() {
        actions.set([])
      },

      reset() {
        actions.set([...resolveHookState(initial.current)])
      },
    }),
    [initial, rerender],
  )

  // eslint-disable-next-line react-hooks/refs
  return [list.current, actions]
}
