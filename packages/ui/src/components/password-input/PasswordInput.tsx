import * as React from "react"

import { cn } from "@lib/utils"
import "./password-input.css"

interface PasswordInputContextValue {
  visible: boolean
  toggle: () => void
  fieldId: string
}

const PasswordInputContext =
  React.createContext<PasswordInputContextValue | null>(null)

function usePasswordInputContext(part: string): PasswordInputContextValue {
  const ctx = React.useContext(PasswordInputContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <PasswordInput> root component`,
    )
  }
  return ctx
}

export interface PasswordInputVisibilityChangeDetails {
  visible: boolean
}

export interface PasswordInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  visible?: boolean
  defaultVisible?: boolean
  onVisibilityChange?: (details: PasswordInputVisibilityChangeDetails) => void
}

function PasswordInput({
  className,
  visible: visibleProp,
  defaultVisible = false,
  onVisibilityChange,
  children,
  ...props
}: PasswordInputProps) {
  const isControlled = visibleProp !== undefined
  const [internalVisible, setInternalVisible] = React.useState(defaultVisible)
  const visible = isControlled ? visibleProp : internalVisible
  const fieldId = React.useId()
  const onVisibilityChangeRef = React.useRef(onVisibilityChange)

  React.useEffect(() => {
    onVisibilityChangeRef.current = onVisibilityChange
  }, [onVisibilityChange])

  const toggle = React.useCallback(() => {
    const next = !(isControlled ? visibleProp : internalVisible)
    if (!isControlled) {
      setInternalVisible(next)
    }
    onVisibilityChangeRef.current?.({ visible: next })
  }, [isControlled, visibleProp, internalVisible])

  const ctx = React.useMemo<PasswordInputContextValue>(
    () => ({ visible, toggle, fieldId }),
    [visible, toggle, fieldId],
  )

  return (
    <div
      className={cn("dr-password-input", className)}
      data-visible={visible ? "true" : "false"}
      {...props}
    >
      <PasswordInputContext.Provider value={ctx}>
        {children}
      </PasswordInputContext.Provider>
    </div>
  )
}

function PasswordInputLabel({
  className,
  htmlFor,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { fieldId } = usePasswordInputContext("PasswordInputLabel")
  return (
    <label
      htmlFor={htmlFor ?? fieldId}
      className={cn("dr-password-input-label", className)}
      {...props}
    />
  )
}

function PasswordInputControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("dr-password-input-control", className)} {...props} />
  )
}

function PasswordInputField({
  className,
  id,
  ref,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  ref?: React.Ref<HTMLInputElement>
}) {
  const { visible, fieldId } = usePasswordInputContext("PasswordInputField")
  return (
    <input
      ref={ref}
      type={visible ? "text" : "password"}
      id={id ?? fieldId}
      className={cn("dr-input", "dr-password-input-field", className)}
      data-visible={visible ? "true" : "false"}
      {...props}
    />
  )
}

function PasswordInputVisibilityTrigger({
  className,
  onClick,
  onMouseDown,
  children,
  type = "button",
  "aria-label": ariaLabel,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) {
  const { visible, toggle } = usePasswordInputContext(
    "PasswordInputVisibilityTrigger",
  )
  const defaultLabel = visible ? "Hide password" : "Show password"
  return (
    <button
      ref={ref}
      type={type}
      className={cn("dr-password-input-trigger", className)}
      data-visible={visible ? "true" : "false"}
      aria-label={ariaLabel ?? defaultLabel}
      aria-pressed={visible}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if (event.defaultPrevented) return
        // Prevent the input from stealing focus on click — keep focus on the
        // trigger so repeated keyboard activation works.
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        toggle()
      }}
      {...props}
    >
      {children}
      <span className="sr-only" role="status" aria-live="polite">
        {visible ? "Password visible" : "Password hidden"}
      </span>
    </button>
  )
}

export interface PasswordInputIndicatorProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children" | "hidden"
> {
  visible?: React.ReactNode
  hidden?: React.ReactNode
  children?: React.ReactNode
}

function PasswordInputIndicator({
  className,
  visible: visibleSlot,
  hidden,
  children,
  ...props
}: PasswordInputIndicatorProps) {
  const { visible } = usePasswordInputContext("PasswordInputIndicator")
  const hiddenSlot = hidden ?? children
  return (
    <span
      className={cn("dr-password-input-indicator", className)}
      data-visible={visible ? "true" : "false"}
      aria-hidden="true"
      {...props}
    >
      {visible ? visibleSlot : hiddenSlot}
    </span>
  )
}

export {
  PasswordInput,
  PasswordInputLabel,
  PasswordInputControl,
  PasswordInputField,
  PasswordInputVisibilityTrigger,
  PasswordInputIndicator,
}
