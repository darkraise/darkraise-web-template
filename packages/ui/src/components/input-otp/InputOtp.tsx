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

/**
 * - `"overlay"` (default): one hidden `<input>` covers the row; `InputOTPSlot`
 *   is a decorative `<div>` that mirrors the input's current character. Matches
 *   the shadcn/input-otp pattern — best for paste flow and iOS one-time-code
 *   autofill.
 * - `"separate"`: each slot is its own `<input maxLength={1}>` with auto-advance
 *   on type, backspace-to-previous, arrow-key navigation, and paste fan-out.
 *   Use when you want each character visibly editable (e.g. accessibility
 *   audits that flag the overlay input as a focus-trap, or designs where
 *   selection per slot reads more clearly).
 */
type InputOTPVariant = "overlay" | "separate"

interface OTPInputContextValue {
  slots: OTPSlotState[]
  variant: InputOTPVariant
  // Overlay mode — slot clicks proxy focus into the shared hidden input.
  focusSlot: (index: number) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  // Separate mode — each slot is its own input with these handlers wired in.
  // Exposed as callbacks (not a raw ref) so consumers don't mutate context.
  registerSlot: (index: number, node: HTMLInputElement | null) => void
  getSlotNodes: () => (HTMLInputElement | null)[]
  setCharAtIndex: (index: number, char: string) => void
  focusIndex: (index: number) => void
  spreadPaste: (startIndex: number, text: string) => void
  maxLength: number
  inputMode: "numeric" | "text"
  pattern?: string
  disabled?: boolean
}

export const OTPInputContext = React.createContext<OTPInputContextValue>({
  slots: [],
  variant: "overlay",
  focusSlot: () => {},
  inputRef: { current: null },
  registerSlot: () => {},
  getSlotNodes: () => [],
  setCharAtIndex: () => {},
  focusIndex: () => {},
  spreadPaste: () => {},
  maxLength: 0,
  inputMode: "numeric",
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
  /**
   * Render strategy for the slots. See {@link InputOTPVariant} for the
   * trade-off. Defaults to `"overlay"`.
   */
  variant?: InputOTPVariant
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
  variant = "overlay",
  disabled,
  autoFocus,
  ref,
  children,
  ...rest
}: InputOTPProps) {
  // OTPs are numeric by default — typed and pasted non-digits get stripped
  // by `normalize` below. Consumers who need alphanumeric/etc. override via
  // `pattern="A-Za-z0-9"`; explicitly passing `pattern=""` disables the
  // filter entirely (any character allowed).
  const effectivePattern = pattern ?? "0-9"
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

  // Per-slot refs for the separate variant. Sized to maxLength lazily when
  // a slot registers itself; entries get populated as each <InputOTPSlot>
  // mounts. The parent owns this ref and exposes register/getter callbacks
  // through context so consumers don't mutate the context value directly.
  const slotRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const registerSlot = React.useCallback(
    (index: number, node: HTMLInputElement | null) => {
      if (slotRefs.current.length !== maxLength) {
        slotRefs.current = new Array<HTMLInputElement | null>(maxLength).fill(
          null,
        )
      }
      slotRefs.current[index] = node
    },
    [maxLength],
  )
  const getSlotNodes = React.useCallback(() => slotRefs.current, [])

  // Normalises a candidate value against `effectivePattern`, drops
  // whitespace, and truncates to maxLength. Shared by both variants so
  // paste/typing produce the same canonical string.
  const normalize = React.useCallback(
    (next: string) => {
      let out = next.replace(/\s/g, "")
      if (effectivePattern) {
        const re = new RegExp(
          `[^${effectivePattern.replace(/[\\^$.*+?()[\]{}|/]/g, "\\$&")}]`,
          "g",
        )
        out = out.replace(re, "")
      }
      if (out.length > maxLength) out = out.slice(0, maxLength)
      return out
    },
    [maxLength, effectivePattern],
  )

  const commit = useEvent((next: string) => {
    if (valueProp === undefined) setInternalValue(next)
    onChange?.(next)
    if (next.length === maxLength) onComplete?.(next)
  })

  const handleChange = useEvent((next: string) => {
    commit(normalize(next))
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

  const focusIndex = useEvent((index: number) => {
    const clamped = Math.max(0, Math.min(maxLength - 1, index))
    const node = slotRefs.current[clamped]
    if (!node) return
    node.focus()
    // Defer the selection so the focus completes first — without this iOS
    // Safari sometimes drops the second character of a paste.
    requestAnimationFrame(() => {
      node.setSelectionRange(0, node.value.length)
    })
  })

  const setCharAtIndex = useEvent((index: number, char: string) => {
    // Replace the slot's character. Pad with empty so we don't lose later
    // slots when the user types into the middle; trim trailing empties so
    // the canonical value never has gaps mid-string.
    const chars = value.split("")
    while (chars.length < maxLength) chars.push("")
    chars[index] = char
    // Trim only trailing empties — preserve internal empties as empty
    // strings so the join keeps holes for later slots.
    let end = chars.length
    while (end > 0 && chars[end - 1] === "") end -= 1
    const next = normalize(chars.slice(0, end).join(""))
    commit(next)
  })

  const spreadPaste = useEvent((startIndex: number, text: string) => {
    const incoming = normalize(text)
    if (!incoming) return
    const chars = value.split("")
    while (chars.length < maxLength) chars.push("")
    let cursor = startIndex
    for (const ch of incoming) {
      if (cursor >= maxLength) break
      chars[cursor] = ch
      cursor += 1
    }
    let end = chars.length
    while (end > 0 && chars[end - 1] === "") end -= 1
    commit(chars.slice(0, end).join(""))
    // Focus the slot after the last one we filled, or the last slot.
    focusIndex(Math.min(cursor, maxLength - 1))
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
    () => ({
      slots,
      variant,
      focusSlot,
      inputRef,
      registerSlot,
      getSlotNodes,
      setCharAtIndex,
      focusIndex,
      spreadPaste,
      maxLength,
      inputMode,
      pattern: effectivePattern,
      disabled,
    }),
    [
      slots,
      variant,
      focusSlot,
      registerSlot,
      getSlotNodes,
      setCharAtIndex,
      focusIndex,
      spreadPaste,
      maxLength,
      inputMode,
      effectivePattern,
      disabled,
    ],
  )

  return (
    <OTPInputContext.Provider value={ctx}>
      <div
        className={cn("dr-input-otp-container", containerClassName)}
        data-variant={variant}
        role={variant === "separate" ? "group" : undefined}
        aria-label={
          variant === "separate"
            ? (rest["aria-label"] ?? "One-time password")
            : undefined
        }
      >
        {children}
        {variant === "overlay" ? (
          <input
            ref={setRef}
            type="text"
            inputMode={inputMode}
            autoComplete="one-time-code"
            autoFocus={autoFocus}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            // HTML form-validation regex; the JS `normalize` filter is the
            // primary defense, this is just a hint for native form submit.
            pattern={effectivePattern ? `[${effectivePattern}]*` : undefined}
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
        ) : null}
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

  if (ctx.variant === "separate") {
    return (
      <InputOTPSlotSeparate
        index={index}
        className={className}
        // Slot props on a div don't map cleanly onto an input, but consumers
        // mostly pass className / data-* / aria-* — accept anything and let
        // the underlying input ignore what it doesn't recognise.
        {...(props as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    )
  }

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

function InputOTPSlotSeparate({
  index,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { index: number }) {
  const ctx = React.useContext(OTPInputContext)
  const slot = ctx.slots[index]
  const char = slot?.char ?? ""

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw.length === 0) {
      ctx.setCharAtIndex(index, "")
      return
    }
    // A multi-character payload (programmatic .value = "abc" or paste that
    // slipped past onPaste) becomes a spread starting at this slot.
    if (raw.length > 1) {
      ctx.spreadPaste(index, raw)
      return
    }
    ctx.setCharAtIndex(index, raw)
    // Auto-advance unless we're already on the last slot.
    if (index < ctx.maxLength - 1) ctx.focusIndex(index + 1)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      // If the slot has a character, clear it and stay. If it's empty,
      // jump back and clear the previous slot's character in one go —
      // matches the cadence users expect from native multi-input OTPs.
      if (char) {
        ctx.setCharAtIndex(index, "")
        event.preventDefault()
        return
      }
      if (index > 0) {
        ctx.setCharAtIndex(index - 1, "")
        ctx.focusIndex(index - 1)
        event.preventDefault()
      }
      return
    }
    if (event.key === "ArrowLeft") {
      if (index > 0) ctx.focusIndex(index - 1)
      event.preventDefault()
      return
    }
    if (event.key === "ArrowRight") {
      if (index < ctx.maxLength - 1) ctx.focusIndex(index + 1)
      event.preventDefault()
      return
    }
    if (event.key === "Home") {
      ctx.focusIndex(0)
      event.preventDefault()
      return
    }
    if (event.key === "End") {
      ctx.focusIndex(ctx.maxLength - 1)
      event.preventDefault()
      return
    }
  }

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text")
    if (!text) return
    event.preventDefault()
    ctx.spreadPaste(index, text)
  }

  return (
    <input
      ref={(node) => {
        ctx.registerSlot(index, node)
      }}
      type="text"
      inputMode={ctx.inputMode}
      maxLength={1}
      autoComplete={index === 0 ? "one-time-code" : "off"}
      disabled={ctx.disabled}
      // HTML form-validation hint matching the JS normalize() filter. The
      // JS path is authoritative; this just helps native form submits.
      pattern={ctx.pattern ? `[${ctx.pattern}]` : undefined}
      value={char}
      aria-label={`Character ${index + 1}`}
      data-active={slot?.isActive || undefined}
      className={cn(
        "dr-input-otp-slot",
        "dr-input-otp-slot-separate",
        className,
      )}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      onFocus={(event) => {
        // When the OTP is empty the only sensible cursor is slot 0 — clicks
        // or shift-tabs landing on a later slot bounce back so the user
        // always starts typing into the leading slot. Read live DOM values
        // rather than `ctx.isEmpty` because this handler fires synchronously
        // inside the onChange→focusIndex chain, before React re-renders
        // with the freshly-committed value.
        if (index !== 0) {
          const refs = ctx.getSlotNodes()
          const allEmpty = refs.every((r) => !r || r.value === "")
          if (allEmpty) {
            ctx.focusIndex(0)
            return
          }
        }
        // Otherwise select-on-focus so typing replaces the existing
        // character cleanly.
        event.currentTarget.select()
      }}
      {...rest}
    />
  )
}
InputOTPSlotSeparate.displayName = "InputOTPSlotSeparate"

function InputOTPSeparator({ ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  )
}
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
