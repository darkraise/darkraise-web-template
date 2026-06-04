import * as React from "react"

import { cn } from "@lib/utils"
import "./editable.css"

import { EditableContext, useEditableContext } from "./Editable.context"
import type { EditableContextValue } from "./Editable.context"

export type EditableState = "preview" | "edit"

export interface EditableValueChangeDetails<T = string> {
  value: T
}

export interface EditableValueCommitDetails<T = string> {
  value: T
}

export interface EditableEditChangeDetails {
  edit: boolean
}

export interface EditableProps<T = string> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  value?: T
  defaultValue?: T
  onValueChange?: (details: EditableValueChangeDetails<T>) => void
  onValueCommit?: (details: EditableValueCommitDetails<T>) => void
  edit?: boolean
  defaultEdit?: boolean
  onEditChange?: (details: EditableEditChangeDetails) => void
  placeholder?: string
  submitOnBlur?: boolean
  submitOnEnter?: boolean
  cancelOnEscape?: boolean
  selectOnFocus?: boolean
  disabled?: boolean
  readOnly?: boolean
  maxLength?: number
}

function Editable<T = string>({
  className,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  edit: editProp,
  defaultEdit = false,
  onEditChange,
  placeholder = "",
  submitOnBlur = true,
  submitOnEnter = true,
  cancelOnEscape = true,
  selectOnFocus = true,
  disabled = false,
  readOnly = false,
  maxLength,
  children,
  ...props
}: EditableProps<T>) {
  const isValueControlled = valueProp !== undefined
  const isEditControlled = editProp !== undefined

  // For the default `T = string` case, fall back to "" so existing consumers
  // don't need to pass `defaultValue`. For non-string `T`, consumers must
  // either pass `defaultValue` or use controlled `value`.
  const initialValue =
    defaultValue !== undefined ? defaultValue : ("" as unknown as T)

  const [internalValue, setInternalValue] = React.useState<T>(initialValue)
  const [internalEdit, setInternalEdit] = React.useState(defaultEdit)

  const value = isValueControlled ? (valueProp as T) : internalValue
  const edit = isEditControlled ? editProp : internalEdit
  const state: EditableState = edit ? "edit" : "preview"

  const [draft, setDraftState] = React.useState<T>(value)
  const inputRef = React.useRef<HTMLElement | null>(null)
  const cancelledRef = React.useRef(false)
  const fieldId = React.useId()

  const onValueChangeRef = React.useRef(onValueChange)
  const onValueCommitRef = React.useRef(onValueCommit)
  const onEditChangeRef = React.useRef(onEditChange)

  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  React.useEffect(() => {
    onValueCommitRef.current = onValueCommit
  }, [onValueCommit])

  React.useEffect(() => {
    onEditChangeRef.current = onEditChange
  }, [onEditChange])

  // Sync draft when committed value changes externally and we're in preview.
  React.useEffect(() => {
    if (!edit) {
      setDraftState(value)
    }
  }, [value, edit])

  const setEdit = React.useCallback(
    (next: boolean) => {
      if (!isEditControlled) {
        setInternalEdit(next)
      }
      onEditChangeRef.current?.({ edit: next })
    },
    [isEditControlled],
  )

  const setDraft = React.useCallback((next: T) => {
    setDraftState(next)
    onValueChangeRef.current?.({ value: next })
  }, [])

  const startEdit = React.useCallback(() => {
    if (disabled || readOnly) return
    setDraftState(value)
    setEdit(true)
  }, [disabled, readOnly, value, setEdit])

  const submit = React.useCallback(() => {
    const next = draft
    if (!isValueControlled) {
      setInternalValue(next)
    }
    onValueCommitRef.current?.({ value: next })
    setEdit(false)
  }, [draft, isValueControlled, setEdit])

  const cancel = React.useCallback(() => {
    cancelledRef.current = true
    setDraftState(value)
    setEdit(false)
  }, [value, setEdit])

  // Focus the input on edit-enter. Text-selection is handled by the
  // bundled `EditableInput` (which knows it has a real <input>); custom
  // slots that wrap richer widgets opt in/out of selection on their own.
  React.useEffect(() => {
    if (!edit) return
    const node = inputRef.current
    if (!node) return
    node.focus()
  }, [edit])

  const ctx = React.useMemo<EditableContextValue<T>>(
    () => ({
      state,
      value,
      draft,
      placeholder,
      setDraft,
      startEdit,
      submit,
      cancel,
      disabled,
      readOnly,
      fieldId,
      inputRef,
      selectOnFocus,
      submitOnBlur,
      submitOnEnter,
      cancelOnEscape,
      maxLength,
      cancelledRef,
    }),
    [
      state,
      value,
      draft,
      placeholder,
      setDraft,
      startEdit,
      submit,
      cancel,
      disabled,
      readOnly,
      fieldId,
      selectOnFocus,
      submitOnBlur,
      submitOnEnter,
      cancelOnEscape,
      maxLength,
    ],
  )

  return (
    <div
      className={cn("dr-editable", className)}
      data-state={state}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      {...props}
    >
      {/* Same variance reason as in `useEditableContext`: TS rejects the
          implicit T→unknown widening on the contravariant `setDraft`. */}
      <EditableContext.Provider
        value={ctx as unknown as EditableContextValue<unknown>}
      >
        {children}
      </EditableContext.Provider>
    </div>
  )
}

function EditableLabel({
  className,
  htmlFor,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { fieldId } = useEditableContext<unknown>("EditableLabel")
  return (
    <label
      htmlFor={htmlFor ?? fieldId}
      className={cn("dr-editable-label", className)}
      {...props}
    />
  )
}

function EditableArea({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useEditableContext<unknown>("EditableArea")
  return (
    <div
      className={cn("dr-editable-area", className)}
      data-state={state}
      {...props}
    />
  )
}

function EditableInput({
  className,
  id,
  onChange,
  onKeyDown,
  onBlur,
  ref,
  ...props
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue"
> & {
  ref?: React.Ref<HTMLInputElement>
}) {
  const {
    state,
    draft,
    placeholder,
    setDraft,
    submit,
    cancel,
    disabled,
    readOnly,
    fieldId,
    inputRef,
    selectOnFocus,
    submitOnBlur,
    submitOnEnter,
    cancelOnEscape,
    maxLength,
    cancelledRef,
  } = useEditableContext<string>("EditableInput")

  const composedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref, inputRef],
  )

  // EditableInput is the string-typed variant — selection on focus only
  // makes sense for plain text, so it lives here rather than in the
  // generic Editable parent. Runs whenever the input mounts via the
  // composed ref while in edit mode.
  React.useEffect(() => {
    if (state !== "edit") return
    const input = inputRef.current
    if (!input || !(input instanceof HTMLInputElement)) return
    if (selectOnFocus) input.select()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const safeSize = Math.max(draft.length, placeholder.length, 4)

  return (
    <input
      ref={composedRef}
      id={id ?? fieldId}
      type="text"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      size={safeSize}
      className={cn("dr-input", "dr-editable-input", className)}
      data-state={state}
      onChange={(event) => {
        onChange?.(event)
        if (event.defaultPrevented) return
        setDraft(event.target.value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "Enter" && submitOnEnter) {
          event.preventDefault()
          submit()
          return
        }
        if (event.key === "Escape" && cancelOnEscape) {
          event.preventDefault()
          cancel()
        }
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (event.defaultPrevented) return
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        if (submitOnBlur) {
          submit()
        }
      }}
      {...props}
    />
  )
}

function EditablePreview({
  className,
  onClick,
  onKeyDown,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  const { state, value, placeholder, startEdit, disabled, readOnly } =
    useEditableContext<unknown>("EditablePreview")

  const stringValue =
    typeof value === "string"
      ? value
      : value === undefined || value === null
        ? ""
        : String(value)
  const isEmpty = stringValue.length === 0
  const interactive = !disabled && !readOnly
  const tabIndex = interactive ? 0 : -1

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={tabIndex}
      aria-disabled={disabled || undefined}
      data-state={state}
      data-empty={isEmpty ? "true" : undefined}
      className={cn("dr-editable-preview", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (!interactive) return
        startEdit()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (!interactive) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          startEdit()
        }
      }}
      {...props}
    >
      {children !== undefined ? children : isEmpty ? placeholder : stringValue}
    </div>
  )
}

function EditableControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useEditableContext<unknown>("EditableControl")
  return (
    <div
      className={cn("dr-editable-control", className)}
      data-state={state}
      {...props}
    />
  )
}

function EditableEditTrigger({
  className,
  type = "button",
  onClick,
  disabled: disabledProp,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) {
  const { state, startEdit, disabled, readOnly } = useEditableContext<unknown>(
    "EditableEditTrigger",
  )
  const isDisabled = disabledProp ?? (disabled || readOnly)
  return (
    <button
      ref={ref}
      type={type}
      className={cn("dr-editable-edit-trigger", className)}
      data-state={state}
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        startEdit()
      }}
      {...props}
    />
  )
}

function EditableSubmitTrigger({
  className,
  type = "button",
  onClick,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) {
  const { state, submit } = useEditableContext<unknown>("EditableSubmitTrigger")
  return (
    <button
      ref={ref}
      type={type}
      className={cn("dr-editable-submit-trigger", className)}
      data-state={state}
      onMouseDown={(event) => {
        // Prevent input blur from running before our click handler. The blur
        // would otherwise fire submit-on-blur (or stale draft) before the
        // explicit Save click resolves.
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        submit()
      }}
      {...props}
    />
  )
}

function EditableCancelTrigger({
  className,
  type = "button",
  onClick,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) {
  const { state, cancel } = useEditableContext<unknown>("EditableCancelTrigger")
  return (
    <button
      ref={ref}
      type={type}
      className={cn("dr-editable-cancel-trigger", className)}
      data-state={state}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        cancel()
      }}
      {...props}
    />
  )
}

export {
  Editable,
  EditableLabel,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableControl,
  EditableEditTrigger,
  EditableSubmitTrigger,
  EditableCancelTrigger,
}
