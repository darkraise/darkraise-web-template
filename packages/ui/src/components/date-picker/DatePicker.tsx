"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { format as dfFormat, isValid as dfIsValid } from "date-fns"
import type { DateRange, Matcher } from "react-day-picker"

import { cn } from "@lib/utils"
import { Calendar } from "@components/calendar"
import "./date-picker.css"

export type DatePickerSingleValue = Date | null
export type DatePickerRangeValue = { from?: Date; to?: Date }

export interface DatePickerValueChangeDetails<
  TValue = DatePickerSingleValue | DatePickerRangeValue,
> {
  value: TValue
}

interface DatePickerCommonProps {
  disabled?: boolean
  placeholder?: string
  min?: Date
  max?: Date
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children?: React.ReactNode
}

export interface DatePickerSingleProps extends DatePickerCommonProps {
  mode?: "single"
  value?: DatePickerSingleValue
  defaultValue?: DatePickerSingleValue
  onValueChange?: (
    details: DatePickerValueChangeDetails<DatePickerSingleValue>,
  ) => void
  format?: (date: Date) => string
  parse?: (input: string) => Date | null
}

export interface DatePickerRangeProps extends DatePickerCommonProps {
  mode: "range"
  value?: DatePickerRangeValue
  defaultValue?: DatePickerRangeValue
  onValueChange?: (
    details: DatePickerValueChangeDetails<DatePickerRangeValue>,
  ) => void
  format?: (range: DatePickerRangeValue) => string
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps

interface DatePickerContextValue {
  mode: "single" | "range"
  singleValue: DatePickerSingleValue
  rangeValue: DatePickerRangeValue
  commitSingle: (date: Date | null) => void
  commitRange: (range: DatePickerRangeValue) => void
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  placeholder?: string
  formatSingle: (date: Date) => string
  formatRange: (range: DatePickerRangeValue) => string
  parse?: (input: string) => Date | null
  min?: Date
  max?: Date
  inputId: string
  labelId: string
  contentId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const DatePickerContext = React.createContext<DatePickerContextValue | null>(
  null,
)

function useDatePickerContext(part: string): DatePickerContextValue {
  const ctx = React.useContext(DatePickerContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <DatePicker> root component`,
    )
  }
  return ctx
}

const defaultFormatSingle = (d: Date) => dfFormat(d, "PPP")
const defaultFormatRange = (r: DatePickerRangeValue) => {
  if (!r.from) return ""
  if (!r.to) return dfFormat(r.from, "LLL dd, y")
  return `${dfFormat(r.from, "LLL dd, y")} – ${dfFormat(r.to, "LLL dd, y")}`
}

function DatePicker(props: DatePickerProps) {
  const {
    mode = "single",
    disabled = false,
    placeholder,
    min,
    max,
    open: openProp,
    defaultOpen,
    onOpenChange,
    className,
    children,
  } = props

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const open = openProp ?? internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )

  const isSingle = mode !== "range"
  const singleProps = isSingle ? (props as DatePickerSingleProps) : null
  const rangeProps = !isSingle ? (props as DatePickerRangeProps) : null

  const [internalSingle, setInternalSingle] =
    React.useState<DatePickerSingleValue>(singleProps?.defaultValue ?? null)
  const [internalRange, setInternalRange] =
    React.useState<DatePickerRangeValue>(rangeProps?.defaultValue ?? {})

  const singleValue: DatePickerSingleValue = isSingle
    ? singleProps?.value !== undefined
      ? (singleProps.value as DatePickerSingleValue)
      : internalSingle
    : null

  const rangeValue: DatePickerRangeValue = !isSingle
    ? rangeProps?.value !== undefined
      ? (rangeProps.value as DatePickerRangeValue)
      : internalRange
    : {}

  const commitSingle = React.useCallback(
    (date: Date | null) => {
      if (singleProps?.value === undefined) setInternalSingle(date)
      singleProps?.onValueChange?.({ value: date })
    },
    [singleProps],
  )

  const commitRange = React.useCallback(
    (range: DatePickerRangeValue) => {
      if (rangeProps?.value === undefined) setInternalRange(range)
      rangeProps?.onValueChange?.({ value: range })
    },
    [rangeProps],
  )

  const formatSingle = React.useMemo(
    () => singleProps?.format ?? defaultFormatSingle,
    [singleProps?.format],
  )
  const formatRange = React.useMemo(
    () => rangeProps?.format ?? defaultFormatRange,
    [rangeProps?.format],
  )

  const parse = singleProps?.parse

  const baseId = React.useId()
  const inputId = `${baseId}-input`
  const labelId = `${baseId}-label`
  const contentId = `${baseId}-content`
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)

  const ctx = React.useMemo<DatePickerContextValue>(
    () => ({
      mode: isSingle ? "single" : "range",
      singleValue,
      rangeValue,
      commitSingle,
      commitRange,
      open,
      setOpen,
      disabled,
      placeholder,
      formatSingle,
      formatRange,
      parse,
      min,
      max,
      inputId,
      labelId,
      contentId,
      triggerRef,
    }),
    [
      isSingle,
      singleValue,
      rangeValue,
      commitSingle,
      commitRange,
      open,
      setOpen,
      disabled,
      placeholder,
      formatSingle,
      formatRange,
      parse,
      min,
      max,
      inputId,
      labelId,
      contentId,
    ],
  )

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <DatePickerContext.Provider value={ctx}>
        <div
          className={cn("dr-date-picker", className)}
          data-state={open ? "open" : "closed"}
          data-disabled={disabled ? "true" : undefined}
          data-mode={isSingle ? "single" : "range"}
        >
          {children}
        </div>
      </DatePickerContext.Provider>
    </PopoverPrimitive.Root>
  )
}

export type DatePickerLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

function DatePickerLabel({ className, ...props }: DatePickerLabelProps) {
  const { labelId, inputId } = useDatePickerContext("DatePickerLabel")
  return (
    <label
      id={labelId}
      htmlFor={inputId}
      className={cn("dr-date-picker-label", className)}
      {...props}
    />
  )
}

export type DatePickerControlProps = React.HTMLAttributes<HTMLDivElement>

function DatePickerControl({ className, ...props }: DatePickerControlProps) {
  const { open, disabled } = useDatePickerContext("DatePickerControl")
  return (
    <div
      className={cn("dr-date-picker-control", className)}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "true" : undefined}
      {...props}
    />
  )
}

export interface DatePickerInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "type"
> {
  ref?: React.Ref<HTMLInputElement>
}

function DatePickerInput({
  className,
  onChange,
  onBlur,
  onKeyDown,
  ref,
  placeholder: placeholderProp,
  "aria-label": ariaLabelProp,
  ...props
}: DatePickerInputProps) {
  const {
    mode,
    singleValue,
    rangeValue,
    commitSingle,
    formatSingle,
    formatRange,
    parse,
    placeholder,
    disabled,
    inputId,
    labelId,
  } = useDatePickerContext("DatePickerInput")

  const formatted = React.useMemo(() => {
    if (mode === "single") return singleValue ? formatSingle(singleValue) : ""
    return formatRange(rangeValue)
  }, [mode, singleValue, rangeValue, formatSingle, formatRange])

  const [draft, setDraft] = React.useState<string | null>(null)
  const display = draft ?? formatted

  const isReadOnly = mode === "range" || !parse

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    if (isReadOnly) return
    setDraft(event.target.value)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    if (event.defaultPrevented) return
    if (isReadOnly || draft === null) return
    if (draft === "") {
      commitSingle(null)
      setDraft(null)
      return
    }
    if (parse) {
      const parsed = parse(draft)
      if (parsed && dfIsValid(parsed)) {
        commitSingle(parsed)
      }
    }
    setDraft(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  return (
    <input
      ref={ref}
      id={inputId}
      type="text"
      value={display}
      placeholder={placeholderProp ?? placeholder}
      readOnly={isReadOnly}
      disabled={disabled}
      aria-labelledby={ariaLabelProp ? undefined : labelId}
      aria-label={ariaLabelProp}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-input", "dr-date-picker-input", className)}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export interface DatePickerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

function DatePickerTrigger({
  className,
  type = "button",
  onClick,
  children,
  ref,
  "aria-label": ariaLabelProp,
  ...props
}: DatePickerTriggerProps) {
  const { open, disabled, contentId, triggerRef } =
    useDatePickerContext("DatePickerTrigger")

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    },
    [ref, triggerRef],
  )

  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={setRef}
        type={type}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={contentId}
        aria-label={ariaLabelProp ?? "Open date picker"}
        disabled={disabled}
        data-state={open ? "open" : "closed"}
        data-disabled={disabled ? "true" : undefined}
        className={cn("dr-date-picker-trigger", className)}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    </PopoverPrimitive.Trigger>
  )
}

export interface DatePickerContentProps extends React.ComponentProps<
  typeof PopoverPrimitive.Content
> {
  ref?: React.Ref<HTMLDivElement>
}

function DatePickerContent({
  className,
  align = "start",
  sideOffset = 4,
  ref,
  children,
  ...props
}: DatePickerContentProps) {
  const { contentId } = useDatePickerContext("DatePickerContent")
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        id={contentId}
        align={align}
        sideOffset={sideOffset}
        role="dialog"
        className={cn("dr-date-picker-content", className)}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function buildDisabledMatcher(
  min: Date | undefined,
  max: Date | undefined,
): Matcher | Matcher[] | undefined {
  const matchers: Matcher[] = []
  if (min) matchers.push({ before: dateOnly(min) })
  if (max) matchers.push({ after: dateOnly(max) })
  if (matchers.length === 0) return undefined
  if (matchers.length === 1) return matchers[0]
  return matchers
}

export type DatePickerCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect" | "disabled"
> & {
  numberOfMonths?: number
  disabled?: Matcher | Matcher[]
}

function DatePickerCalendar({
  className,
  numberOfMonths,
  disabled: disabledProp,
  ...props
}: DatePickerCalendarProps) {
  const {
    mode,
    singleValue,
    rangeValue,
    commitSingle,
    commitRange,
    setOpen,
    min,
    max,
  } = useDatePickerContext("DatePickerCalendar")

  const minMaxMatcher = buildDisabledMatcher(min, max)
  const combinedDisabled = React.useMemo<
    Matcher | Matcher[] | undefined
  >(() => {
    if (!disabledProp && !minMaxMatcher) return undefined
    if (!disabledProp) return minMaxMatcher
    if (!minMaxMatcher) return disabledProp
    const a = Array.isArray(disabledProp) ? disabledProp : [disabledProp]
    const b = Array.isArray(minMaxMatcher) ? minMaxMatcher : [minMaxMatcher]
    return [...a, ...b]
  }, [disabledProp, minMaxMatcher])

  if (mode === "single") {
    return (
      <Calendar
        mode="single"
        selected={singleValue ?? undefined}
        onSelect={(d) => {
          commitSingle(d ?? null)
          if (d) setOpen(false)
        }}
        className={cn("dr-date-picker-calendar", className)}
        disabled={combinedDisabled}
        autoFocus
        {...props}
      />
    )
  }

  const selected: DateRange | undefined = rangeValue.from
    ? { from: rangeValue.from, to: rangeValue.to }
    : undefined

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={(r) => {
        const next: DatePickerRangeValue = {
          from: r?.from,
          to: r?.to,
        }
        commitRange(next)
        if (next.from && next.to) setOpen(false)
      }}
      className={cn("dr-date-picker-calendar", className)}
      disabled={combinedDisabled}
      numberOfMonths={numberOfMonths}
      min={1}
      autoFocus
      {...props}
    />
  )
}

export type DatePickerPresetsProps = React.HTMLAttributes<HTMLDivElement>

function DatePickerPresets({ className, ...props }: DatePickerPresetsProps) {
  return (
    <div
      role="group"
      aria-label="Presets"
      className={cn("dr-date-picker-presets", className)}
      {...props}
    />
  )
}

export interface DatePickerPresetProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> {
  value: Date | DatePickerRangeValue
}

function DatePickerPreset({
  className,
  type = "button",
  value,
  onClick,
  children,
  ...props
}: DatePickerPresetProps) {
  const { mode, commitSingle, commitRange, setOpen } =
    useDatePickerContext("DatePickerPreset")

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (mode === "single") {
      const date = value instanceof Date ? value : (value.from ?? null)
      commitSingle(date)
    } else {
      const range: DatePickerRangeValue =
        value instanceof Date ? { from: value, to: value } : { ...value }
      commitRange(range)
    }
    setOpen(false)
  }

  return (
    <button
      type={type}
      className={cn("dr-date-picker-preset", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  DatePicker,
  DatePickerLabel,
  DatePickerControl,
  DatePickerInput,
  DatePickerTrigger,
  DatePickerContent,
  DatePickerCalendar,
  DatePickerPresets,
  DatePickerPreset,
}
