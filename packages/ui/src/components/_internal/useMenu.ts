"use client"

import * as React from "react"
import { useControllableState, useEvent, useId } from "@primitives/state"

export interface MenuItemDescriptor {
  value: string
  textValue: string
  disabled: boolean
  ref: React.RefObject<HTMLElement | null>
}

export interface UseMenuOptions {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Loop arrow navigation past first/last item. Defaults to true. */
  loop?: boolean
  /** Typeahead window in ms. Defaults to 500. */
  typeaheadDuration?: number
  /** Orientation. "vertical" for menus, "horizontal" for menubar tier. */
  orientation?: "vertical" | "horizontal"
}

export interface UseMenuReturn {
  open: boolean
  setOpen: (next: boolean) => void
  toggle: () => void
  state: "open" | "closed"
  triggerId: string
  contentId: string
  /** index of currently focused item (-1 = none) */
  focusedIndex: number
  setFocusedIndex: (next: number) => void
  registerItem: (item: MenuItemDescriptor) => () => void
  /** Get item descriptor by index. */
  getItemAt: (index: number) => MenuItemDescriptor | undefined
  /** Sorted list of all currently registered items in DOM order. */
  items: () => MenuItemDescriptor[]
  /** Move focus to first/last enabled item. */
  focusFirst: () => void
  focusLast: () => void
  /** Move focus to next/previous enabled item. */
  focusNext: () => void
  focusPrev: () => void
  /** Process a typeahead character; returns the matched index or -1. */
  typeahead: (char: string) => number
}

function compareNodeOrder(a: Element, b: Element): number {
  if (a === b) return 0
  const cmp = a.compareDocumentPosition(b)
  if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

export function useMenu(options: UseMenuOptions = {}): UseMenuReturn {
  const {
    open: openProp,
    defaultOpen,
    onOpenChange,
    loop = true,
    typeaheadDuration = 500,
  } = options

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  const triggerId = useId()
  const contentId = useId()

  const toggle = useEvent(() => setOpen(!open))

  const [focusedIndex, setFocusedIndexState] = React.useState(-1)
  const setFocusedIndex = React.useCallback((next: number) => {
    setFocusedIndexState(next)
  }, [])

  // Items are stored in a ref to allow imperative reads without re-renders.
  const itemsRef = React.useRef<MenuItemDescriptor[]>([])
  // Bumping nonce forces consumers (sortItems) to recompute when items change.
  const [, setItemsNonce] = React.useState(0)

  const sortItems = React.useCallback((): MenuItemDescriptor[] => {
    const list = itemsRef.current.filter((it) => it.ref.current != null)
    list.sort((a, b) => {
      const aNode = a.ref.current
      const bNode = b.ref.current
      if (!aNode || !bNode) return 0
      return compareNodeOrder(aNode, bNode)
    })
    return list
  }, [])

  const items = React.useCallback(
    (): MenuItemDescriptor[] => sortItems(),
    [sortItems],
  )

  const registerItem = React.useCallback((item: MenuItemDescriptor) => {
    itemsRef.current = [...itemsRef.current, item]
    setItemsNonce((n) => n + 1)
    return () => {
      itemsRef.current = itemsRef.current.filter((it) => it !== item)
      setItemsNonce((n) => n + 1)
    }
  }, [])

  const getItemAt = React.useCallback(
    (index: number): MenuItemDescriptor | undefined => {
      const list = sortItems()
      return list[index]
    },
    [sortItems],
  )

  const moveFocus = React.useCallback(
    (from: number, direction: 1 | -1, list: MenuItemDescriptor[]): number => {
      if (list.length === 0) return -1
      let i = from
      for (let step = 0; step < list.length; step += 1) {
        i += direction
        if (i < 0) {
          if (!loop) return from === -1 ? -1 : from
          i = list.length - 1
        } else if (i >= list.length) {
          if (!loop) return from === -1 ? -1 : from
          i = 0
        }
        if (!list[i]?.disabled) return i
      }
      return -1
    },
    [loop],
  )

  const focusFirst = React.useCallback(() => {
    const list = sortItems()
    for (let i = 0; i < list.length; i += 1) {
      if (!list[i]?.disabled) {
        setFocusedIndex(i)
        return
      }
    }
    setFocusedIndex(-1)
  }, [setFocusedIndex, sortItems])

  const focusLast = React.useCallback(() => {
    const list = sortItems()
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (!list[i]?.disabled) {
        setFocusedIndex(i)
        return
      }
    }
    setFocusedIndex(-1)
  }, [setFocusedIndex, sortItems])

  const focusNext = React.useCallback(() => {
    const list = sortItems()
    const next = moveFocus(focusedIndex, 1, list)
    if (next !== -1) setFocusedIndex(next)
  }, [focusedIndex, moveFocus, setFocusedIndex, sortItems])

  const focusPrev = React.useCallback(() => {
    const list = sortItems()
    const next = moveFocus(focusedIndex, -1, list)
    if (next !== -1) setFocusedIndex(next)
  }, [focusedIndex, moveFocus, setFocusedIndex, sortItems])

  // Typeahead buffer + timer in refs to avoid re-renders.
  const typeBufferRef = React.useRef("")
  const typeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const typeahead = React.useCallback(
    (char: string): number => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
      typeBufferRef.current = (typeBufferRef.current + char).toLowerCase()
      typeTimerRef.current = setTimeout(() => {
        typeBufferRef.current = ""
      }, typeaheadDuration)

      const list = sortItems()
      if (list.length === 0) return -1
      const buffer = typeBufferRef.current
      const len = list.length
      // When no item is focused, search from index 0 inclusive. When an item
      // IS focused: chained characters (buffer length > 1) keep the same
      // focus if it still matches; a fresh single character moves to the
      // NEXT match after the current focus, wrapping (WAI APG menu).
      let startOffset: number
      let startIndex: number
      if (focusedIndex < 0) {
        startIndex = 0
        startOffset = 0
      } else if (buffer.length > 1) {
        startIndex = focusedIndex
        startOffset = 0
      } else {
        startIndex = focusedIndex
        startOffset = 1
      }
      for (let step = startOffset; step <= len; step += 1) {
        const i = (startIndex + step) % len
        const item = list[i]
        if (!item || item.disabled) continue
        if (item.textValue.toLowerCase().startsWith(buffer)) {
          setFocusedIndex(i)
          return i
        }
      }
      return -1
    },
    [focusedIndex, setFocusedIndex, sortItems, typeaheadDuration],
  )

  // Reset focus when menu closes.
  React.useEffect(() => {
    if (!open) setFocusedIndexState(-1)
  }, [open])

  // Clear typeahead timer on unmount.
  React.useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    }
  }, [])

  return {
    open,
    setOpen,
    toggle,
    state: open ? "open" : "closed",
    triggerId,
    contentId,
    focusedIndex,
    setFocusedIndex,
    registerItem,
    getItemAt,
    items,
    focusFirst,
    focusLast,
    focusNext,
    focusPrev,
    typeahead,
  }
}
