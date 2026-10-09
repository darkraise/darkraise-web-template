import * as React from "react"
import { useComposedRefs } from "@primitives/slot"
import { useId } from "@primitives/state"

export interface MenuItemRecord {
  id: string
  value: string
  textValue: string
  disabled: boolean
  ref: React.RefObject<HTMLDivElement | null>
}

export interface UseMenuItemOptions {
  registerItem: (item: MenuItemRecord) => void
  unregisterItem: (id: string) => void
  focusedId: string | null
  ref?: React.Ref<HTMLDivElement>
  disabled?: boolean
  textValue?: string
  children?: React.ReactNode
  /** Value stored on the item's record. Defaults to the item id. */
  value?: string
}

export interface UseMenuItemReturn {
  id: string
  localRef: React.RefObject<HTMLDivElement | null>
  composedRef: React.RefCallback<HTMLDivElement>
  isFocused: boolean
}

export function useMenuItem({
  registerItem,
  unregisterItem,
  focusedId,
  ref,
  disabled,
  textValue,
  children,
  value,
}: UseMenuItemOptions): UseMenuItemReturn {
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const id = useId()
  const recordValue = value ?? id

  // Replacing a known id's record does not re-render the menu, so syncing a
  // changed field cannot start a render loop. Removal lives in its own
  // effect: a field change must not unregister the item, or focus would
  // leave it.
  // Without a textValue the typeahead text is the rendered text, so the
  // record is refreshed whenever the children change.
  React.useLayoutEffect(() => {
    registerItem({
      id,
      value: recordValue,
      disabled: !!disabled,
      textValue: textValue ?? localRef.current?.textContent ?? "",
      ref: localRef,
    })
  }, [registerItem, id, recordValue, disabled, textValue, children])
  React.useLayoutEffect(() => () => unregisterItem(id), [unregisterItem, id])

  const isFocused = focusedId === id

  React.useEffect(() => {
    if (isFocused) localRef.current?.focus({ preventScroll: true })
  }, [isFocused])

  const composedRef = useComposedRefs(localRef, ref)

  return { id, localRef, composedRef, isFocused }
}
