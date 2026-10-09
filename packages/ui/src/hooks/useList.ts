import type { SetStateAction } from "react"
import { useMemo, useRef, useState } from "react"
import { useSyncedRef } from "./useSyncedRef"
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
  const [list, setList] = useState(() => resolveHookState(initialList))
  // Mirrors the list synchronously, so several actions in one handler each
  // see the result of the one before.
  const latest = useRef(list)

  const actions = useMemo(
    () => ({
      set(newList: SetStateAction<T[]>) {
        latest.current = resolveHookState(newList, latest.current)
        setList(latest.current)
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
        const indexOfMatch = latest.current.findIndex((item: T) =>
          predicate(item, newItem),
        )
        const NO_MATCH = -1
        if (indexOfMatch > NO_MATCH) {
          actions.updateAt(indexOfMatch, newItem)
        }
      },

      upsert(predicate: (iteratedItem: T, newItem: T) => boolean, newItem: T) {
        const indexOfMatch = latest.current.findIndex((item: T) =>
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
    [initial],
  )

  return [list, actions]
}
