"use client"

import * as React from "react"

import type { EditableState } from "./Editable"

/**
 * Generic over the value type `T` so consumers can wire `Editable` to a
 * custom widget (e.g. NumberInput, DatePicker, color picker, tags input).
 * The state machine (preview ↔ edit, draft / value, submit / cancel) is
 * value-type agnostic; the bundled `EditableInput` is specialised for
 * `T = string`. For other types, build a custom slot that reads
 * `useEditableContext<T>()` and writes through `setDraft`.
 */
export interface EditableContextValue<T = unknown> {
  state: EditableState
  value: T
  draft: T
  placeholder: string
  setDraft: (next: T) => void
  startEdit: () => void
  submit: () => void
  cancel: () => void
  disabled: boolean
  readOnly: boolean
  fieldId: string
  /** Ref to the FIRST focusable element produced by `EditableInput` or a
   *  custom slot. Loosened to `HTMLElement` so consumers can plug in
   *  textareas, buttons, or composite widgets. */
  inputRef: React.RefObject<HTMLElement | null>
  selectOnFocus: boolean
  submitOnBlur: boolean
  submitOnEnter: boolean
  cancelOnEscape: boolean
  maxLength: number | undefined
  cancelledRef: React.RefObject<boolean>
}

const EditableContext =
  React.createContext<EditableContextValue<unknown> | null>(null)

/**
 * Read the current Editable context. Pass a generic `T` matching the
 * `Editable<T>` parent so `value`, `draft`, and `setDraft` are typed
 * correctly inside custom widgets.
 */
function useEditableContext<T = unknown>(
  part: string,
): EditableContextValue<T> {
  const ctx = React.useContext(EditableContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within an <Editable> root component`,
    )
  }
  // Double cast through unknown — `setDraft` is contravariant in T, so
  // a single cast from `unknown` to `T` is rejected by TS strict mode.
  return ctx as unknown as EditableContextValue<T>
}

export { EditableContext, useEditableContext }
