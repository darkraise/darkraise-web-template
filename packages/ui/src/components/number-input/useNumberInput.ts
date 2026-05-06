import * as React from "react"

export interface NumberInputValueChangeDetails {
  value: string
  valueAsNumber: number
}

export interface UseNumberInputProps {
  value?: number | undefined
  defaultValue?: number | undefined
  onValueChange?: (details: NumberInputValueChangeDetails) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  allowMouseWheel?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export interface UseNumberInputReturn {
  valueAsNumber: number
  valueAsString: string
  displayString: string
  setInputString: (next: string) => void
  commit: () => void
  increment: (multiplier?: number) => void
  decrement: (multiplier?: number) => void
  setValue: (next: number) => void
  isAtMin: boolean
  isAtMax: boolean
  disabled: boolean
  readOnly: boolean
  min?: number
  max?: number
  fieldId: string
  labelId: string
  isFocused: boolean
  setFocused: (focused: boolean) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  handleWheel: (event: WheelEvent) => void
  allowMouseWheel: boolean
  attachInput: (element: HTMLInputElement | null) => void
}

interface Separators {
  decimal: string
  group: string
  literals: string[]
}

function getSeparators(
  locale: string | undefined,
  formatOptions: Intl.NumberFormatOptions | undefined,
): Separators {
  try {
    const fmt = new Intl.NumberFormat(locale, formatOptions)
    const parts = fmt.formatToParts(1234567.89)
    let decimal = "."
    let group = ","
    const literals: string[] = []
    for (const part of parts) {
      if (part.type === "decimal") decimal = part.value
      else if (part.type === "group") group = part.value
      else if (
        part.type === "currency" ||
        part.type === "percentSign" ||
        part.type === "literal" ||
        part.type === "unit"
      ) {
        if (part.value && !literals.includes(part.value)) {
          literals.push(part.value)
        }
      }
    }
    return { decimal, group, literals }
  } catch {
    return { decimal: ".", group: ",", literals: [] }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function parseInputString(
  raw: string,
  separators: Separators,
  formatOptions: Intl.NumberFormatOptions | undefined,
): number {
  if (!raw) return Number.NaN
  let working = raw.trim()
  if (!working) return Number.NaN

  for (const literal of separators.literals) {
    working = working.split(literal).join("")
  }
  // Strip any non-numeric symbols (currency, % etc.) characters Intl may add.
  working = working.replace(/\s+/gu, "")

  if (separators.group) {
    const groupRe = new RegExp(escapeRegExp(separators.group), "g")
    working = working.replace(groupRe, "")
  }
  if (separators.decimal && separators.decimal !== ".") {
    working = working.split(separators.decimal).join(".")
  }

  // For percent style the displayed "50%" actually represents 0.5; keep parity
  // with the raw entered number so user keeps typing freely.
  let parsed = Number.parseFloat(working)
  if (Number.isNaN(parsed)) return Number.NaN

  if (formatOptions?.style === "percent") {
    parsed = parsed / 100
  }

  return parsed
}

function formatNumber(
  value: number,
  locale: string | undefined,
  formatOptions: Intl.NumberFormatOptions | undefined,
  precision: number | undefined,
): string {
  if (Number.isNaN(value)) return ""

  if (formatOptions) {
    try {
      const fmt = new Intl.NumberFormat(locale, formatOptions)
      return fmt.format(value)
    } catch {
      // fall through to plain number formatting
    }
  }

  if (precision !== undefined) {
    if (precision <= 0) {
      return Math.trunc(value).toString()
    }
    return value.toFixed(precision)
  }
  return value.toString()
}

function clamp(
  value: number,
  min: number | undefined,
  max: number | undefined,
): number {
  let next = value
  if (typeof min === "number" && next < min) next = min
  if (typeof max === "number" && next > max) next = max
  return next
}

function roundToPrecision(
  value: number,
  precision: number | undefined,
): number {
  if (Number.isNaN(value)) return value
  if (precision === undefined) return value
  if (precision <= 0) return Math.trunc(value)
  const factor = Math.pow(10, precision)
  return Math.round(value * factor) / factor
}

export function useNumberInput(
  props: UseNumberInputProps,
): UseNumberInputReturn {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    min,
    max,
    step = 1,
    precision,
    formatOptions,
    locale,
    allowMouseWheel = false,
    disabled = false,
    readOnly = false,
  } = props

  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<number>(() => {
    if (defaultValue !== undefined) return defaultValue
    return Number.NaN
  })
  const valueAsNumber = isControlled ? (valueProp as number) : internalValue

  // Mirror the latest value in a ref so press-and-hold bursts and other
  // non-render-driven actions can read the freshest number without waiting
  // for the next React render.
  const valueRef = React.useRef(valueAsNumber)
  React.useEffect(() => {
    valueRef.current = valueAsNumber
  }, [valueAsNumber])

  const onValueChangeRef = React.useRef(onValueChange)
  React.useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  const fieldId = React.useId()
  const labelId = React.useId()

  const separators = React.useMemo(
    () => getSeparators(locale, formatOptions),
    [locale, formatOptions],
  )

  const formatValue = React.useCallback(
    (n: number): string => formatNumber(n, locale, formatOptions, precision),
    [locale, formatOptions, precision],
  )

  const valueAsString = React.useMemo(
    () => formatValue(valueAsNumber),
    [formatValue, valueAsNumber],
  )

  const [isFocused, setFocused] = React.useState(false)
  const [editingString, setEditingString] = React.useState<string | null>(null)

  // When value changes externally and we're not editing, drop any stale string.
  React.useEffect(() => {
    if (!isFocused) setEditingString(null)
  }, [valueAsNumber, isFocused])

  const displayString = isFocused
    ? (editingString ?? valueAsString)
    : valueAsString

  const updateValue = React.useCallback(
    (next: number) => {
      const rounded = roundToPrecision(next, precision)
      const formatted = formatNumber(rounded, locale, formatOptions, precision)
      if (!isControlled) {
        setInternalValue(rounded)
      }
      valueRef.current = rounded
      onValueChangeRef.current?.({ value: formatted, valueAsNumber: rounded })
    },
    [isControlled, locale, formatOptions, precision],
  )

  const setValue = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max)
      updateValue(clamped)
    },
    [min, max, updateValue],
  )

  const increment = React.useCallback(
    (multiplier = 1) => {
      const current = valueRef.current
      const base = Number.isNaN(current) ? (min ?? 0) : current
      setValue(base + step * multiplier)
    },
    [min, step, setValue],
  )

  const decrement = React.useCallback(
    (multiplier = 1) => {
      const current = valueRef.current
      const base = Number.isNaN(current) ? (max ?? 0) : current
      setValue(base - step * multiplier)
    },
    [max, step, setValue],
  )

  const setInputString = React.useCallback(
    (next: string) => {
      setEditingString(next)
      const parsed = parseInputString(next, separators, formatOptions)
      if (Number.isNaN(parsed)) {
        if (next === "") {
          if (!isControlled) setInternalValue(Number.NaN)
          onValueChangeRef.current?.({ value: "", valueAsNumber: Number.NaN })
        }
        return
      }
      // Allow out-of-range while typing — clamp on commit/blur.
      if (!isControlled) setInternalValue(parsed)
      onValueChangeRef.current?.({ value: next, valueAsNumber: parsed })
    },
    [separators, formatOptions, isControlled],
  )

  const commit = React.useCallback(() => {
    if (editingString === null) return
    const parsed = parseInputString(editingString, separators, formatOptions)
    if (Number.isNaN(parsed)) {
      setEditingString(null)
      return
    }
    const clamped = clamp(parsed, min, max)
    updateValue(clamped)
    setEditingString(null)
  }, [editingString, separators, formatOptions, min, max, updateValue])

  const isAtMin =
    typeof min === "number" &&
    !Number.isNaN(valueAsNumber) &&
    valueAsNumber <= min
  const isAtMax =
    typeof max === "number" &&
    !Number.isNaN(valueAsNumber) &&
    valueAsNumber >= max

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return
      const multiplier = event.shiftKey ? 10 : 1
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault()
          increment(multiplier)
          return
        case "ArrowDown":
          event.preventDefault()
          decrement(multiplier)
          return
        case "PageUp":
          event.preventDefault()
          increment(10)
          return
        case "PageDown":
          event.preventDefault()
          decrement(10)
          return
        case "Home":
          if (typeof min === "number") {
            event.preventDefault()
            setValue(min)
          }
          return
        case "End":
          if (typeof max === "number") {
            event.preventDefault()
            setValue(max)
          }
          return
        case "Enter":
          commit()
          return
      }
    },
    [disabled, readOnly, increment, decrement, min, max, setValue, commit],
  )

  // Native, non-passive wheel listener so we can preventDefault and only
  // act when the input is actually focused.
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const handleWheelRef = React.useRef<(event: WheelEvent) => void>(() => {})

  React.useEffect(() => {
    handleWheelRef.current = (event: WheelEvent) => {
      if (!allowMouseWheel) return
      if (disabled || readOnly) return
      if (document.activeElement !== inputRef.current) return
      event.preventDefault()
      if (event.deltaY < 0) {
        increment()
      } else if (event.deltaY > 0) {
        decrement()
      }
    }
  }, [allowMouseWheel, disabled, readOnly, increment, decrement])

  // Stable listener — always reads through the ref so allowMouseWheel changes
  // don't require detaching/reattaching the listener on every render.
  const wheelListenerRef = React.useRef<(event: WheelEvent) => void>((event) =>
    handleWheelRef.current(event),
  )

  const attachInput = React.useCallback((element: HTMLInputElement | null) => {
    const previous = inputRef.current
    const listener = wheelListenerRef.current
    if (previous && previous !== element) {
      previous.removeEventListener("wheel", listener)
    }
    inputRef.current = element
    if (element) {
      element.addEventListener("wheel", listener, { passive: false })
    }
  }, [])

  React.useEffect(() => {
    const listener = wheelListenerRef.current
    return () => {
      const element = inputRef.current
      if (element) element.removeEventListener("wheel", listener)
    }
  }, [])

  return {
    valueAsNumber,
    valueAsString,
    displayString,
    setInputString,
    commit,
    increment,
    decrement,
    setValue,
    isAtMin,
    isAtMax,
    disabled,
    readOnly,
    min,
    max,
    fieldId,
    labelId,
    isFocused,
    setFocused,
    handleKeyDown,
    handleWheel: (event) => handleWheelRef.current(event),
    allowMouseWheel,
    attachInput,
  }
}
