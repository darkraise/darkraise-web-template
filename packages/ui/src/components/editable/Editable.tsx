import * as React from "react"

import { cn } from "../../lib/utils"
import "./editable.css"

export type EditableState = "preview" | "edit"

export interface EditableValueChangeDetails {
  value: string
}

export interface EditableValueCommitDetails {
  value: string
}

export interface EditableEditChangeDetails {
  edit: boolean
}

interface EditableContextValue {
  state: EditableState
  value: string
  draft: string
  placeholder: string
  setDraft: (next: string) => void
  startEdit: () => void
  submit: () => void
  cancel: () => void
  disabled: boolean
  readOnly: boolean
  fieldId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  selectOnFocus: boolean
  submitOnBlur: boolean
  submitOnEnter: boolean
  cancelOnEscape: boolean
  maxLength: number | undefined
  cancelledRef: React.RefObject<boolean>
}

const EditableContext = React.createContext<EditableContextValue | null>(null)

function useEditableContext(part: string): EditableContextValue {
  const ctx = React.useContext(EditableContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within an <Editable> root component`,
    )
  }
  return ctx
}

export interface EditableProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (details: EditableValueChangeDetails) => void
  onValueCommit?: (details: EditableValueCommitDetails) => void
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

function Editable({
  className,
  value: valueProp,
  defaultValue = "",
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
}: EditableProps) {
  const isValueControlled = valueProp !== undefined
  const isEditControlled = editProp !== undefined

  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [internalEdit, setInternalEdit] = React.useState(defaultEdit)

  const value = isValueControlled ? valueProp : internalValue
  const edit = isEditControlled ? editProp : internalEdit
  const state: EditableState = edit ? "edit" : "preview"

  const [draft, setDraftState] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
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

  const setDraft = React.useCallback((next: string) => {
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

  // Focus + select-on-focus when entering edit mode.
  React.useEffect(() => {
    if (!edit) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (selectOnFocus) {
      input.select()
    }
  }, [edit, selectOnFocus])

  const ctx = React.useMemo<EditableContextValue>(
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
      <EditableContext.Provider value={ctx}>
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
  const { fieldId } = useEditableContext("EditableLabel")
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
  const { state } = useEditableContext("EditableArea")
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
    submitOnBlur,
    submitOnEnter,
    cancelOnEscape,
    maxLength,
    cancelledRef,
  } = useEditableContext("EditableInput")

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
  ref,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  const { state, value, placeholder, startEdit, disabled, readOnly } =
    useEditableContext("EditablePreview")

  const isEmpty = value.length === 0
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
      {isEmpty ? placeholder : value}
    </div>
  )
}

function EditableControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state } = useEditableContext("EditableControl")
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
  const { state, startEdit, disabled, readOnly } = useEditableContext(
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
  const { state, submit } = useEditableContext("EditableSubmitTrigger")
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
  const { state, cancel } = useEditableContext("EditableCancelTrigger")
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
