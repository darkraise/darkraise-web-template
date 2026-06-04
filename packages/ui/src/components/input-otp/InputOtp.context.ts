import * as React from "react"

export interface OTPSlotState {
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
export type InputOTPVariant = "overlay" | "separate"

export interface OTPInputContextValue {
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
