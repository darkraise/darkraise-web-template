import * as React from "react"
import { Dot } from "lucide-react"

import { cn } from "@lib/utils"
import { useEvent } from "@primitives/state"
import "./input-otp.css"

interface OTPSlotState {
  char: string | null
  hasFakeCaret: boolean
  isActive: boolean
}

interface OTPInputContextValue {
  slots: OTPSlotState[]
  focusSlot: (index: number) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export const OTPInputContext = React.createContext<OTPInputContextValue>({
  slots: [],
  focusSlot: () => {},
  inputRef: { current: null },
})

interface InputOTPProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "size"
> {
  maxLength: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  containerClassName?: string
  pattern?: string
  inputMode?: "numeric" | "text"
  ref?: React.Ref<HTMLInputElement>
}

function InputOTP({
  maxLength,
  value: valueProp,
  defaultValue,
  onChange,
  onComplete,
  containerClassName,
  className,
  pattern,
  inputMode = "numeric",
  disabled,
  autoFocus,
  ref,
  children,
  ...rest
}: InputOTPProps) {
  const [internalValue, setInternalValue] = React.useState<string>(
    defaultValue ?? "",
  )
  const value = valueProp ?? internalValue

  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [ref],
  )

  const [focused, setFocused] = React.useState(false)
  const [selectionStart, setSelectionStart] = React.useState<number>(0)
  const [selectionEnd, setSelectionEnd] = React.useState<number>(0)

  const handleChange = useEvent((next: string) => {
    let normalized = next.replace(/\s/g, "")
    if (pattern) {
      const re = new RegExp(
        `[^${pattern.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&")}]`,
        "g",
      )
      normalized = normalized.replace(re, "")
    }
    if (normalized.length > maxLength)
      normalized = normalized.slice(0, maxLength)
    if (valueProp === undefined) setInternalValue(normalized)
    onChange?.(normalized)
    if (normalized.length === maxLength) onComplete?.(normalized)
  })

  const focusSlot = useEvent((index: number) => {
    const node = inputRef.current
    if (!node) return
    node.focus()
    const cursor = Math.min(index, value.length)
    requestAnimationFrame(() => {
      node.setSelectionRange(cursor, cursor)
      setSelectionStart(cursor)
      setSelectionEnd(cursor)
    })
  })

  const slots = React.useMemo<OTPSlotState[]>(() => {
    const out: OTPSlotState[] = []
    for (let i = 0; i < maxLength; i++) {
      const char = value[i] ?? null
      let isActive = false
      if (focused) {
        if (selectionStart === selectionEnd) {
          isActive = i === selectionStart
        } else {
          isActive = i >= selectionStart && i < selectionEnd
        }
        // when caret is past last char, light up the trailing empty slot
        if (selectionStart >= value.length && i === value.length) {
          isActive = true
        }
      }
      const hasFakeCaret =
        focused &&
        selectionStart === selectionEnd &&
        i === selectionStart &&
        char === null
      out.push({ char, hasFakeCaret, isActive })
    }
    return out
  }, [value, maxLength, focused, selectionStart, selectionEnd])

  const ctx = React.useMemo<OTPInputContextValue>(
    () => ({ slots, focusSlot, inputRef }),
    [slots, focusSlot],
  )

  return (
    <OTPInputContext.Provider value={ctx}>
      <div className={cn("dr-input-otp-container", containerClassName)}>
        {children}
        <input
          ref={setRef}
          type="text"
          inputMode={inputMode}
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          pattern={pattern}
          onChange={(event) => handleChange(event.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSelect={(event) => {
            const target = event.currentTarget
            setSelectionStart(target.selectionStart ?? 0)
            setSelectionEnd(target.selectionEnd ?? 0)
          }}
          aria-label="One-time password"
          className={cn(
            "dr-input-otp",
            "absolute inset-0 w-full opacity-0",
            className,
          )}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "auto",
          }}
          {...rest}
        />
      </div>
    </OTPInputContext.Provider>
  )
}
InputOTP.displayName = "InputOTP"

function InputOTPGroup({
  className,
  ref,
  onClick,
  ...props
}: React.ComponentProps<"div">) {
  const ctx = React.useContext(OTPInputContext)
  return (
    <div
      ref={ref}
      className={cn("dr-input-otp-group", className)}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        // Focus the hidden input when the visible group is clicked.
        ctx.inputRef.current?.focus()
      }}
      {...props}
    />
  )
}
InputOTPGroup.displayName = "InputOTPGroup"

function InputOTPSlot({
  index,
  className,
  ref,
  onClick,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const ctx = React.useContext(OTPInputContext)
  const slot = ctx.slots[index]
  const char = slot?.char ?? null
  const hasFakeCaret = slot?.hasFakeCaret ?? false
  const isActive = slot?.isActive ?? false

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={`Character ${index + 1}`}
      className={cn("dr-input-otp-slot", className)}
      data-active={isActive || undefined}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        ctx.focusSlot(index)
      }}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}
InputOTPSlot.displayName = "InputOTPSlot"

function InputOTPSeparator({ ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  )
}
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
