import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@lib/utils"
import {
  useNumberInput,
  type NumberInputValueChangeDetails,
  type UseNumberInputProps,
} from "./useNumberInput"
import "./number-input.css"

interface NumberInputContextValue {
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
  min: number | undefined
  max: number | undefined
  fieldId: string
  labelId: string
  isFocused: boolean
  setFocused: (focused: boolean) => void
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  attachInput: (element: HTMLInputElement | null) => void
}

const NumberInputContext = React.createContext<NumberInputContextValue | null>(
  null,
)

function useNumberInputContext(part: string): NumberInputContextValue {
  const ctx = React.useContext(NumberInputContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <NumberInput> root component`,
    )
  }
  return ctx
}

export type { NumberInputValueChangeDetails }

export interface NumberInputProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    UseNumberInputProps {}

function NumberInput({
  className,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  precision,
  formatOptions,
  locale,
  allowMouseWheel,
  disabled,
  readOnly,
  children,
  ...rest
}: NumberInputProps) {
  const machine = useNumberInput({
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    step,
    precision,
    formatOptions,
    locale,
    allowMouseWheel,
    disabled,
    readOnly,
  })

  const ctx = React.useMemo<NumberInputContextValue>(
    () => ({
      valueAsNumber: machine.valueAsNumber,
      valueAsString: machine.valueAsString,
      displayString: machine.displayString,
      setInputString: machine.setInputString,
      commit: machine.commit,
      increment: machine.increment,
      decrement: machine.decrement,
      setValue: machine.setValue,
      isAtMin: machine.isAtMin,
      isAtMax: machine.isAtMax,
      disabled: machine.disabled,
      readOnly: machine.readOnly,
      min: machine.min,
      max: machine.max,
      fieldId: machine.fieldId,
      labelId: machine.labelId,
      isFocused: machine.isFocused,
      setFocused: machine.setFocused,
      handleKeyDown: machine.handleKeyDown,
      attachInput: machine.attachInput,
    }),
    [
      machine.valueAsNumber,
      machine.valueAsString,
      machine.displayString,
      machine.setInputString,
      machine.commit,
      machine.increment,
      machine.decrement,
      machine.setValue,
      machine.isAtMin,
      machine.isAtMax,
      machine.disabled,
      machine.readOnly,
      machine.min,
      machine.max,
      machine.fieldId,
      machine.labelId,
      machine.isFocused,
      machine.setFocused,
      machine.handleKeyDown,
      machine.attachInput,
    ],
  )

  return (
    <div
      className={cn("dr-number-input", className)}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      {...rest}
    >
      <NumberInputContext.Provider value={ctx}>
        {children}
      </NumberInputContext.Provider>
    </div>
  )
}

function NumberInputLabel({
  className,
  htmlFor,
  id,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { fieldId, labelId } = useNumberInputContext("NumberInputLabel")
  return (
    <label
      htmlFor={htmlFor ?? fieldId}
      id={id ?? labelId}
      className={cn("dr-number-input-label", className)}
      {...props}
    />
  )
}

function NumberInputControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-number-input-control", className)} {...props} />
}

function NumberInputField({
  className,
  id,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  ref,
  inputMode = "decimal",
  ...props
}: Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue"
> & { ref?: React.Ref<HTMLInputElement> }) {
  const ctx = useNumberInputContext("NumberInputField")
  const localRef = React.useRef<HTMLInputElement | null>(null)

  const setRefs = React.useCallback(
    (element: HTMLInputElement | null) => {
      localRef.current = element
      ctx.attachInput(element)
      if (typeof ref === "function") ref(element)
      else if (ref && typeof ref === "object")
        (ref as React.RefObject<HTMLInputElement | null>).current = element
    },
    [ctx, ref],
  )

  return (
    <input
      ref={setRefs}
      type="text"
      role="spinbutton"
      inputMode={inputMode}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      id={id ?? ctx.fieldId}
      value={ctx.displayString}
      readOnly={ctx.readOnly}
      disabled={ctx.disabled}
      aria-valuenow={
        Number.isNaN(ctx.valueAsNumber) ? undefined : ctx.valueAsNumber
      }
      aria-valuemin={ctx.min}
      aria-valuemax={ctx.max}
      aria-disabled={ctx.disabled || undefined}
      aria-readonly={ctx.readOnly || undefined}
      data-focused={ctx.isFocused ? "true" : undefined}
      className={cn("dr-input", "dr-number-input-field", className)}
      onChange={(event) => {
        onChange?.(event)
        if (event.defaultPrevented) return
        ctx.setInputString(event.target.value)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        if (event.defaultPrevented) return
        ctx.setFocused(true)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (event.defaultPrevented) return
        ctx.commit()
        ctx.setFocused(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        ctx.handleKeyDown(event)
      }}
      {...props}
    />
  )
}

interface StepperButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>
}

const PRESS_HOLD_DELAY_MS = 400
const PRESS_HOLD_INTERVAL_MS = 100

function useStepperPressHold(action: () => void, disabled: boolean) {
  const actionRef = React.useRef(action)
  const timeoutRef = React.useRef<number | null>(null)
  const intervalRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    actionRef.current = action
  }, [action])

  const stop = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = React.useCallback(() => {
    if (disabled) return
    actionRef.current()
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        actionRef.current()
      }, PRESS_HOLD_INTERVAL_MS)
    }, PRESS_HOLD_DELAY_MS)
  }, [disabled])

  React.useEffect(() => () => stop(), [stop])

  return { start, stop }
}

function NumberInputIncrementTrigger({
  className,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onClick,
  disabled,
  type = "button",
  children,
  ref,
  "aria-label": ariaLabel,
  ...props
}: StepperButtonProps) {
  const ctx = useNumberInputContext("NumberInputIncrementTrigger")
  const isDisabled = disabled ?? (ctx.disabled || ctx.isAtMax)
  const { start, stop } = useStepperPressHold(() => ctx.increment(), isDisabled)
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "dr-number-input-stepper",
        "dr-number-input-stepper-increment",
        className,
      )}
      data-disabled={isDisabled ? "true" : undefined}
      tabIndex={-1}
      aria-label={ariaLabel ?? "Increment"}
      disabled={isDisabled}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if (event.defaultPrevented) return
        // Prevent stealing focus from the field.
        event.preventDefault()
        start()
      }}
      onMouseUp={(event) => {
        onMouseUp?.(event)
        stop()
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event)
        stop()
      }}
      onClick={(event) => {
        onClick?.(event)
      }}
      {...props}
    >
      {children ?? <ChevronUp aria-hidden="true" />}
    </button>
  )
}

function NumberInputDecrementTrigger({
  className,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onClick,
  disabled,
  type = "button",
  children,
  ref,
  "aria-label": ariaLabel,
  ...props
}: StepperButtonProps) {
  const ctx = useNumberInputContext("NumberInputDecrementTrigger")
  const isDisabled = disabled ?? (ctx.disabled || ctx.isAtMin)
  const { start, stop } = useStepperPressHold(() => ctx.decrement(), isDisabled)
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "dr-number-input-stepper",
        "dr-number-input-stepper-decrement",
        className,
      )}
      data-disabled={isDisabled ? "true" : undefined}
      tabIndex={-1}
      aria-label={ariaLabel ?? "Decrement"}
      disabled={isDisabled}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
        start()
      }}
      onMouseUp={(event) => {
        onMouseUp?.(event)
        stop()
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event)
        stop()
      }}
      onClick={(event) => {
        onClick?.(event)
      }}
      {...props}
    >
      {children ?? <ChevronDown aria-hidden="true" />}
    </button>
  )
}

export {
  NumberInput,
  NumberInputLabel,
  NumberInputControl,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputDecrementTrigger,
}
