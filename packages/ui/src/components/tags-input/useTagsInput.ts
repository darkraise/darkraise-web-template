"use client"

import * as React from "react"

export interface TagsInputValueChangeDetails {
  value: string[]
}

export interface TagsInputValidateDetails {
  inputValue: string
  value: string[]
}

export interface UseTagsInputOptions {
  value?: string[]
  defaultValue?: string[]
  inputValue?: string
  defaultInputValue?: string
  delimiter?: string | string[]
  validate?: (inputValue: string, currentTags: string[]) => boolean
  maxItems?: number
  allowDuplicates?: boolean
  blurBehavior?: "add" | "clear" | "ignore"
  pasteSplit?: boolean
  disabled?: boolean
  readOnly?: boolean
  onValueChange?: (details: TagsInputValueChangeDetails) => void
  onInputValueChange?: (details: { value: string }) => void
  onValidate?: (details: TagsInputValidateDetails & { valid: boolean }) => void
}

export interface UseTagsInputReturn {
  value: string[]
  inputValue: string
  focusedIndex: number
  editingIndex: number
  delimiterChars: string[]
  delimiterKeys: string[]
  pasteSplit: boolean
  blurBehavior: "add" | "clear" | "ignore"
  disabled: boolean
  readOnly: boolean
  maxItems: number | undefined
  allowDuplicates: boolean
  setInputValue: (next: string) => void
  setFocusedIndex: (index: number) => void
  setEditingIndex: (index: number) => void
  addTag: (tagValue: string) => boolean
  addTags: (tagValues: string[]) => number
  removeTag: (index: number) => void
  editTag: (index: number, nextValue: string) => boolean
  clearAll: () => void
  baseId: string
}

function normalizeDelimiter(d: string | string[] | undefined): {
  chars: string[]
  keys: string[]
} {
  const list = Array.isArray(d) ? d : d === undefined ? [",", "Enter"] : [d]
  const chars: string[] = []
  const keys: string[] = []
  for (const item of list) {
    if (item.length > 1) {
      keys.push(item)
    } else {
      chars.push(item)
    }
  }
  return { chars, keys }
}

export function useTagsInput(options: UseTagsInputOptions): UseTagsInputReturn {
  const {
    value: valueProp,
    defaultValue,
    inputValue: inputValueProp,
    defaultInputValue = "",
    delimiter,
    validate,
    maxItems,
    allowDuplicates = false,
    blurBehavior = "ignore",
    pasteSplit = true,
    disabled = false,
    readOnly = false,
    onValueChange,
    onInputValueChange,
    onValidate,
  } = options

  const baseId = React.useId()

  const valueControlled = valueProp !== undefined
  const inputControlled = inputValueProp !== undefined

  const [internalValue, setInternalValue] = React.useState<string[]>(
    () => defaultValue ?? [],
  )
  const [internalInput, setInternalInput] =
    React.useState<string>(defaultInputValue)
  const [focusedIndex, setFocusedIndexState] = React.useState<number>(-1)
  const [editingIndex, setEditingIndexState] = React.useState<number>(-1)

  const value = valueControlled ? valueProp : internalValue
  const inputValue = inputControlled ? inputValueProp : internalInput

  const onValueChangeRef = React.useRef(onValueChange)
  const onInputValueChangeRef = React.useRef(onInputValueChange)
  const onValidateRef = React.useRef(onValidate)
  const validateRef = React.useRef(validate)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
    onInputValueChangeRef.current = onInputValueChange
    onValidateRef.current = onValidate
    validateRef.current = validate
  })

  const { chars: delimiterChars, keys: delimiterKeys } = React.useMemo(
    () => normalizeDelimiter(delimiter),
    [delimiter],
  )

  const setInputValue = React.useCallback(
    (next: string) => {
      if (!inputControlled) setInternalInput(next)
      onInputValueChangeRef.current?.({ value: next })
    },
    [inputControlled],
  )

  const commitValue = React.useCallback(
    (next: string[]) => {
      if (!valueControlled) setInternalValue(next)
      onValueChangeRef.current?.({ value: next })
    },
    [valueControlled],
  )

  const setFocusedIndex = React.useCallback((index: number) => {
    setFocusedIndexState(index)
  }, [])

  const setEditingIndex = React.useCallback((index: number) => {
    setEditingIndexState(index)
  }, [])

  const tryAccept = React.useCallback(
    (raw: string, accumulated: string[]): boolean => {
      const trimmed = raw.trim()
      if (!trimmed) return false
      if (!allowDuplicates && accumulated.includes(trimmed)) {
        onValidateRef.current?.({
          inputValue: trimmed,
          value: accumulated,
          valid: false,
        })
        return false
      }
      if (maxItems !== undefined && accumulated.length >= maxItems) {
        onValidateRef.current?.({
          inputValue: trimmed,
          value: accumulated,
          valid: false,
        })
        return false
      }
      const validator = validateRef.current
      if (validator && !validator(trimmed, accumulated)) {
        onValidateRef.current?.({
          inputValue: trimmed,
          value: accumulated,
          valid: false,
        })
        return false
      }
      onValidateRef.current?.({
        inputValue: trimmed,
        value: accumulated,
        valid: true,
      })
      return true
    },
    [allowDuplicates, maxItems],
  )

  const addTag = React.useCallback(
    (raw: string): boolean => {
      if (disabled || readOnly) return false
      const accumulated = value.slice()
      if (!tryAccept(raw, accumulated)) return false
      const trimmed = raw.trim()
      commitValue([...accumulated, trimmed])
      setInputValue("")
      return true
    },
    [disabled, readOnly, value, tryAccept, commitValue, setInputValue],
  )

  const addTags = React.useCallback(
    (raws: string[]): number => {
      if (disabled || readOnly) return 0
      const accumulated = value.slice()
      let added = 0
      for (const raw of raws) {
        if (tryAccept(raw, accumulated)) {
          accumulated.push(raw.trim())
          added++
        }
      }
      if (added > 0) {
        commitValue(accumulated)
        setInputValue("")
      }
      return added
    },
    [disabled, readOnly, value, tryAccept, commitValue, setInputValue],
  )

  const removeTag = React.useCallback(
    (index: number) => {
      if (disabled || readOnly) return
      if (index < 0 || index >= value.length) return
      const next = value.filter((_, i) => i !== index)
      commitValue(next)
      setFocusedIndexState((curr) => {
        if (curr === index) return Math.max(-1, index - 1)
        if (curr > index) return curr - 1
        return curr
      })
    },
    [disabled, readOnly, value, commitValue],
  )

  const editTag = React.useCallback(
    (index: number, nextValue: string): boolean => {
      if (disabled || readOnly) return false
      if (index < 0 || index >= value.length) return false
      const trimmed = nextValue.trim()
      if (!trimmed) {
        const next = value.filter((_, i) => i !== index)
        commitValue(next)
        setEditingIndexState(-1)
        return true
      }
      if (!allowDuplicates) {
        const dupIndex = value.findIndex((v, i) => i !== index && v === trimmed)
        if (dupIndex !== -1) return false
      }
      const validator = validateRef.current
      if (
        validator &&
        !validator(
          trimmed,
          value.filter((_, i) => i !== index),
        )
      )
        return false
      const next = [...value]
      next[index] = trimmed
      commitValue(next)
      setEditingIndexState(-1)
      return true
    },
    [disabled, readOnly, value, allowDuplicates, commitValue],
  )

  const clearAll = React.useCallback(() => {
    if (disabled || readOnly) return
    commitValue([])
    setInputValue("")
    setFocusedIndexState(-1)
    setEditingIndexState(-1)
  }, [disabled, readOnly, commitValue, setInputValue])

  return {
    value,
    inputValue,
    focusedIndex,
    editingIndex,
    delimiterChars,
    delimiterKeys,
    pasteSplit,
    blurBehavior,
    disabled,
    readOnly,
    maxItems,
    allowDuplicates,
    setInputValue,
    setFocusedIndex,
    setEditingIndex,
    addTag,
    addTags,
    removeTag,
    editTag,
    clearAll,
    baseId,
  }
}
