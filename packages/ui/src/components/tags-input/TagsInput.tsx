"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import {
  type TagsInputValueChangeDetails,
  type TagsInputValidateDetails,
  type UseTagsInputOptions,
  type UseTagsInputReturn,
  useTagsInput,
} from "./useTagsInput"
import "./tags-input.css"

export type { TagsInputValueChangeDetails, TagsInputValidateDetails }

interface TagsInputContextValue extends UseTagsInputReturn {
  inputRef: React.RefObject<HTMLInputElement | null>
  rootRef: React.RefObject<HTMLDivElement | null>
  name?: string
  focusInput: () => void
  focusTag: (index: number) => void
}

const TagsInputContext = React.createContext<TagsInputContextValue | null>(null)

function useTagsInputContext(part: string): TagsInputContextValue {
  const ctx = React.useContext(TagsInputContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <TagsInput> root component`,
    )
  }
  return ctx
}

interface TagsInputItemContextValue {
  index: number
  value: string
  focused: boolean
  editing: boolean
  itemDisabled: boolean
}

const TagsInputItemContext =
  React.createContext<TagsInputItemContextValue | null>(null)

function useTagsInputItemContext(part: string): TagsInputItemContextValue {
  const ctx = React.useContext(TagsInputItemContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <TagsInputItem>`)
  }
  return ctx
}

export interface TagsInputProps
  extends
    Omit<UseTagsInputOptions, never>,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  name?: string
  children?: React.ReactNode
}

function TagsInput({
  className,
  value,
  defaultValue,
  inputValue,
  defaultInputValue,
  delimiter,
  validate,
  maxItems,
  allowDuplicates,
  blurBehavior,
  pasteSplit,
  disabled,
  readOnly,
  onValueChange,
  onInputValueChange,
  onValidate,
  name,
  children,
  ...rest
}: TagsInputProps) {
  const state = useTagsInput({
    value,
    defaultValue,
    inputValue,
    defaultInputValue,
    delimiter,
    validate,
    maxItems,
    allowDuplicates,
    blurBehavior,
    pasteSplit,
    disabled,
    readOnly,
    onValueChange,
    onInputValueChange,
    onValidate,
  })

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const focusInput = React.useCallback(() => {
    inputRef.current?.focus()
    state.setFocusedIndex(-1)
  }, [state])

  const focusTag = React.useCallback(
    (index: number) => {
      const node = rootRef.current?.querySelector<HTMLElement>(
        `[data-tag-preview="${index}"]`,
      )
      node?.focus()
      state.setFocusedIndex(index)
    },
    [state],
  )

  const ctx = React.useMemo<TagsInputContextValue>(
    () => ({
      ...state,
      inputRef,
      rootRef,
      name,
      focusInput,
      focusTag,
    }),
    [state, name, focusInput, focusTag],
  )

  return (
    <div
      ref={rootRef}
      className={cn("dr-tags-input", className)}
      data-disabled={state.disabled ? "true" : undefined}
      data-readonly={state.readOnly ? "true" : undefined}
      {...rest}
    >
      <TagsInputContext.Provider value={ctx}>
        {children}
      </TagsInputContext.Provider>
    </div>
  )
}

export type TagsInputLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

function TagsInputLabel({ className, ...props }: TagsInputLabelProps) {
  const { baseId } = useTagsInputContext("TagsInputLabel")
  return (
    <label
      htmlFor={`${baseId}-input`}
      className={cn("dr-tags-input-label", className)}
      {...props}
    />
  )
}

export interface TagsInputControlProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function TagsInputControl({
  className,
  onClick,
  onPaste,
  ref,
  ...props
}: TagsInputControlProps) {
  const ctx = useTagsInputContext("TagsInputControl")
  const {
    disabled,
    readOnly,
    pasteSplit,
    delimiterChars,
    addTags,
    focusInput,
  } = ctx

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (disabled) return
    // Clicking the control surface (not a tag/button) focuses the input.
    const target = event.target as HTMLElement
    if (target.closest("[data-tag-index]")) return
    if (target.closest("button")) return
    if (target.tagName === "INPUT") return
    focusInput()
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    onPaste?.(event)
    if (event.defaultPrevented) return
    if (disabled || readOnly) return
    if (!pasteSplit || delimiterChars.length === 0) return
    const text = event.clipboardData.getData("text")
    if (!text) return
    const escaped = delimiterChars.map(escapeRegex).join("|")
    const re = new RegExp(escaped)
    if (!re.test(text)) return
    event.preventDefault()
    const parts = text.split(re)
    addTags(parts)
  }

  return (
    <div
      ref={ref}
      className={cn("dr-tags-input-control", className)}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      onClick={handleClick}
      onPaste={handlePaste}
      {...props}
    />
  )
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export interface TagsInputItemProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number
  value: string
  disabled?: boolean
}

function TagsInputItem({
  className,
  index,
  value,
  disabled: disabledProp,
  children,
  ...props
}: TagsInputItemProps) {
  const ctx = useTagsInputContext("TagsInputItem")
  const focused = ctx.focusedIndex === index
  const editing = ctx.editingIndex === index
  const itemDisabled = !!disabledProp || ctx.disabled

  const itemCtx = React.useMemo<TagsInputItemContextValue>(
    () => ({ index, value, focused, editing, itemDisabled }),
    [index, value, focused, editing, itemDisabled],
  )

  return (
    <TagsInputItemContext.Provider value={itemCtx}>
      <div
        className={cn("dr-tags-input-item", className)}
        data-tag-index={index}
        data-value={value}
        data-highlighted={focused ? "true" : undefined}
        data-editing={editing ? "true" : undefined}
        data-disabled={itemDisabled ? "true" : undefined}
        {...props}
      >
        {children}
      </div>
    </TagsInputItemContext.Provider>
  )
}

export interface TagsInputItemPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function TagsInputItemPreview({
  className,
  onClick,
  onDoubleClick,
  onKeyDown,
  ref,
  ...props
}: TagsInputItemPreviewProps) {
  const ctx = useTagsInputContext("TagsInputItemPreview")
  const item = useTagsInputItemContext("TagsInputItemPreview")
  const { editing, focused, itemDisabled, index } = item

  if (editing) return null

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (itemDisabled) return
    ctx.focusTag(index)
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(event)
    if (event.defaultPrevented) return
    if (itemDisabled || ctx.readOnly) return
    ctx.setInputValue(item.value)
    ctx.setEditingIndex(index)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (itemDisabled || ctx.readOnly) return
    switch (event.key) {
      case "Backspace":
      case "Delete": {
        event.preventDefault()
        const removeIdx = index
        ctx.removeTag(removeIdx)
        if (removeIdx > 0) {
          ctx.focusTag(removeIdx - 1)
        } else {
          ctx.focusInput()
        }
        return
      }
      case "ArrowLeft": {
        if (index > 0) {
          event.preventDefault()
          ctx.focusTag(index - 1)
        }
        return
      }
      case "ArrowRight": {
        event.preventDefault()
        if (index < ctx.value.length - 1) {
          ctx.focusTag(index + 1)
        } else {
          ctx.focusInput()
        }
        return
      }
      case "Home": {
        event.preventDefault()
        if (ctx.value.length > 0) ctx.focusTag(0)
        return
      }
      case "End": {
        event.preventDefault()
        ctx.focusInput()
        return
      }
      case "Escape": {
        event.preventDefault()
        ctx.focusInput()
        return
      }
      case "Enter": {
        event.preventDefault()
        ctx.setInputValue(item.value)
        ctx.setEditingIndex(index)
        return
      }
      default:
        return
    }
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={itemDisabled ? -1 : 0}
      aria-label={`${item.value}, press Backspace to delete`}
      data-tag-preview={index}
      data-highlighted={focused ? "true" : undefined}
      className={cn("dr-tags-input-item-preview", className)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export type TagsInputItemTextProps = React.HTMLAttributes<HTMLSpanElement>

function TagsInputItemText({
  className,
  children,
  ...props
}: TagsInputItemTextProps) {
  const item = useTagsInputItemContext("TagsInputItemText")
  return (
    <span className={cn("dr-tags-input-item-text", className)} {...props}>
      {children ?? item.value}
    </span>
  )
}

export interface TagsInputItemDeleteTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function TagsInputItemDeleteTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  ...props
}: TagsInputItemDeleteTriggerProps) {
  const ctx = useTagsInputContext("TagsInputItemDeleteTrigger")
  const item = useTagsInputItemContext("TagsInputItemDeleteTrigger")

  return (
    <button
      ref={ref}
      type={type}
      tabIndex={-1}
      aria-label={`Remove ${item.value}`}
      disabled={item.itemDisabled || ctx.readOnly}
      data-disabled={item.itemDisabled ? "true" : undefined}
      className={cn("dr-tags-input-item-delete-trigger", className)}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.removeTag(item.index)
        ctx.focusInput()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TagsInputItemInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  ref?: React.Ref<HTMLInputElement>
}

function TagsInputItemInput({
  className,
  onBlur,
  onKeyDown,
  ref,
  ...props
}: TagsInputItemInputProps) {
  const ctx = useTagsInputContext("TagsInputItemInput")
  const item = useTagsInputItemContext("TagsInputItemInput")
  const { editing, index } = item

  const localRef = React.useRef<HTMLInputElement | null>(null)

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      localRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [ref],
  )

  React.useEffect(() => {
    if (editing && localRef.current) {
      localRef.current.focus()
      localRef.current.select()
    }
  }, [editing])

  if (!editing) return null

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    if (event.defaultPrevented) return
    if (ctx.blurBehavior === "add") {
      ctx.editTag(index, ctx.inputValue)
    } else if (ctx.blurBehavior === "clear") {
      ctx.setInputValue("")
      ctx.setEditingIndex(-1)
    } else {
      ctx.setEditingIndex(-1)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Enter") {
      event.preventDefault()
      ctx.editTag(index, ctx.inputValue)
      ctx.setInputValue("")
      ctx.focusInput()
      return
    }
    if (event.key === "Escape") {
      event.preventDefault()
      ctx.setInputValue("")
      ctx.setEditingIndex(-1)
      ctx.focusInput()
    }
  }

  return (
    <input
      ref={setRef}
      type="text"
      value={ctx.inputValue}
      data-editing="true"
      className={cn("dr-tags-input-input", className)}
      onChange={(event) => ctx.setInputValue(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export interface TagsInputInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  ref?: React.Ref<HTMLInputElement>
}

function TagsInputInput({
  className,
  onChange,
  onKeyDown,
  onBlur,
  onFocus,
  ref,
  placeholder,
  ...props
}: TagsInputInputProps) {
  const ctx = useTagsInputContext("TagsInputInput")
  const {
    inputValue,
    setInputValue,
    addTag,
    removeTag,
    value,
    delimiterChars,
    delimiterKeys,
    blurBehavior,
    disabled,
    readOnly,
    inputRef,
    focusTag,
    setFocusedIndex,
    focusedIndex,
    editingIndex,
    baseId,
  } = ctx

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [inputRef, ref],
  )

  // Hide the main input while a tag is being edited so only the inline
  // editor accepts input.
  if (editingIndex !== -1) return null

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    const next = event.target.value
    // Char delimiter: strip the trailing delimiter and commit if a tag exists.
    if (delimiterChars.length > 0 && next.length > inputValue.length) {
      const lastChar = next.slice(-1)
      if (delimiterChars.includes(lastChar)) {
        const candidate = next.slice(0, -1)
        if (candidate.trim()) {
          addTag(candidate)
          return
        }
        setInputValue("")
        return
      }
    }
    setInputValue(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (disabled) return

    if (delimiterKeys.includes(event.key) && !readOnly) {
      if (inputValue.trim()) {
        event.preventDefault()
        addTag(inputValue)
        return
      }
      if (event.key === "Enter") event.preventDefault()
      return
    }

    if (event.key === "Backspace") {
      const caret = event.currentTarget.selectionStart ?? 0
      if (inputValue.length === 0 && caret === 0 && value.length > 0) {
        if (focusedIndex === -1) {
          // First press: highlight the last tag.
          event.preventDefault()
          setFocusedIndex(value.length - 1)
          return
        }
        // Second press: delete the highlighted tag.
        event.preventDefault()
        const idx = focusedIndex
        removeTag(idx)
        setFocusedIndex(-1)
        return
      }
      return
    }

    if (event.key === "ArrowLeft") {
      const caret = event.currentTarget.selectionStart ?? 0
      if (caret === 0 && value.length > 0) {
        event.preventDefault()
        focusTag(value.length - 1)
      }
      return
    }

    if (event.key === "Home") {
      const caret = event.currentTarget.selectionStart ?? 0
      if (caret === 0 && value.length > 0) {
        event.preventDefault()
        focusTag(0)
      }
      return
    }

    if (event.key === "Escape") {
      setInputValue("")
      setFocusedIndex(-1)
      return
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    if (event.defaultPrevented) return
    if (readOnly || disabled) return
    if (blurBehavior === "add" && inputValue.trim()) {
      addTag(inputValue)
    } else if (blurBehavior === "clear") {
      setInputValue("")
    }
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event)
    if (event.defaultPrevented) return
    setFocusedIndex(-1)
  }

  return (
    <input
      ref={setRef}
      id={`${baseId}-input`}
      type="text"
      value={inputValue}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      autoComplete="off"
      className={cn("dr-tags-input-input", className)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export interface TagsInputClearTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function TagsInputClearTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  ...props
}: TagsInputClearTriggerProps) {
  const { value, clearAll, disabled, readOnly, focusInput } =
    useTagsInputContext("TagsInputClearTrigger")

  if (value.length === 0) return null

  return (
    <button
      ref={ref}
      type={type}
      tabIndex={-1}
      aria-label="Clear all tags"
      disabled={disabled || readOnly}
      data-disabled={disabled || readOnly ? "true" : undefined}
      className={cn("dr-tags-input-item-delete-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        clearAll()
        focusInput()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function TagsInputHiddenInput() {
  const { name, value } = useTagsInputContext("TagsInputHiddenInput")
  if (!name) return null
  return (
    <>
      {value.map((v, i) => (
        <input
          key={`${name}-${i}`}
          type="hidden"
          name={`${name}[]`}
          value={v}
        />
      ))}
    </>
  )
}

export {
  TagsInput,
  TagsInputLabel,
  TagsInputControl,
  TagsInputItem,
  TagsInputItemPreview,
  TagsInputItemText,
  TagsInputItemDeleteTrigger,
  TagsInputItemInput,
  TagsInputInput,
  TagsInputClearTrigger,
  TagsInputHiddenInput,
}
