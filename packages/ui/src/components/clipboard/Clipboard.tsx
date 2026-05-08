import * as React from "react"

import { Button } from "@components/button"
import { toast } from "@components/sonner"
import { cn } from "@lib/utils"
import "./clipboard.css"

export interface ClipboardCopyDetails {
  copied: boolean
  value: string
  error?: Error
}

export type ClipboardToastOption =
  | boolean
  | {
      success?: string | false
      error?: string | false
    }

const DEFAULT_SUCCESS_MESSAGE = "Copied to clipboard"
const DEFAULT_ERROR_MESSAGE = "Failed to copy"

function resolveSuccessMessage(
  option: ClipboardToastOption | undefined,
): string | null {
  if (!option) return null
  if (option === true) return DEFAULT_SUCCESS_MESSAGE
  if (option.success === false) return null
  return option.success ?? DEFAULT_SUCCESS_MESSAGE
}

function resolveErrorMessage(
  option: ClipboardToastOption | undefined,
): string | null {
  if (!option) return null
  if (option === true) return DEFAULT_ERROR_MESSAGE
  if (option.error === false) return null
  return option.error ?? DEFAULT_ERROR_MESSAGE
}

interface ClipboardContextValue {
  value: string
  copied: boolean
  copy: () => void
  timeout: number
}

const ClipboardContext = React.createContext<ClipboardContextValue | null>(null)

function useClipboardContext(part: string): ClipboardContextValue {
  const ctx = React.useContext(ClipboardContext)
  if (!ctx) {
    throw new Error(
      `<${part}> must be used within a <Clipboard> root component`,
    )
  }
  return ctx
}

export interface ClipboardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  value: string
  timeout?: number
  onCopyStatusChange?: (details: ClipboardCopyDetails) => void
  /**
   * Show a toast on copy success/error. `true` uses defaults
   * (`"Copied to clipboard"` / `"Failed to copy"`); pass an object to
   * customise messages or set `success: false` / `error: false` to silence
   * one direction. Requires a `<Toaster />` mounted in the app.
   */
  toast?: ClipboardToastOption
}

function Clipboard({
  className,
  value,
  timeout = 2000,
  onCopyStatusChange,
  toast: toastOption,
  children,
  ...props
}: ClipboardProps) {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = React.useRef(true)
  const onStatusChangeRef = React.useRef(onCopyStatusChange)
  const toastOptionRef = React.useRef(toastOption)

  React.useEffect(() => {
    onStatusChangeRef.current = onCopyStatusChange
  }, [onCopyStatusChange])

  React.useEffect(() => {
    toastOptionRef.current = toastOption
  }, [toastOption])

  React.useEffect(() => {
    // Reset on every effect setup, not just on first mount: under React 19
    // StrictMode the setup → cleanup → setup cycle leaves a cleanup-only ref
    // permanently `false`, which would short-circuit every subsequent
    // `copy()` (no toast, no copied state, etc.).
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void (async () => {
      try {
        await navigator.clipboard.writeText(value)
        if (!mountedRef.current) return
        setCopied(true)
        onStatusChangeRef.current?.({ copied: true, value })
        const successMessage = resolveSuccessMessage(toastOptionRef.current)
        if (successMessage) toast.success(successMessage)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return
          setCopied(false)
          onStatusChangeRef.current?.({ copied: false, value })
        }, timeout)
      } catch (err) {
        if (!mountedRef.current) return
        const error = err instanceof Error ? err : new Error(String(err))
        onStatusChangeRef.current?.({ copied: false, value, error })
        const errorMessage = resolveErrorMessage(toastOptionRef.current)
        if (errorMessage) toast.error(errorMessage)
      }
    })()
  }, [value, timeout])

  const ctx = React.useMemo<ClipboardContextValue>(
    () => ({ value, copied, copy, timeout }),
    [value, copied, copy, timeout],
  )

  return (
    <div
      className={cn("dr-clipboard", className)}
      data-copied={copied ? "true" : "false"}
      {...props}
    >
      <ClipboardContext.Provider value={ctx}>
        {children}
      </ClipboardContext.Provider>
    </div>
  )
}

function ClipboardLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("dr-clipboard-label", className)} {...props} />
}

function ClipboardControl({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-clipboard-control", className)} {...props} />
}

function ClipboardInput({
  className,
  ref,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "readOnly"> & {
  ref?: React.Ref<HTMLInputElement>
}) {
  const { value } = useClipboardContext("ClipboardInput")
  return (
    <input
      ref={ref}
      type="text"
      readOnly
      value={value}
      className={cn("dr-input", "dr-clipboard-input", className)}
      {...props}
    />
  )
}

function ClipboardTrigger({
  className,
  onClick,
  children,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) {
  const { copy, copied } = useClipboardContext("ClipboardTrigger")
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      className={cn("dr-clipboard-trigger", className)}
      data-copied={copied ? "true" : "false"}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        copy()
      }}
      {...props}
    >
      {children}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  )
}

export interface ClipboardIndicatorProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  copied?: React.ReactNode
  fallback?: React.ReactNode
  children?: React.ReactNode
}

function ClipboardIndicator({
  className,
  copied: copiedSlot,
  fallback,
  children,
  ...props
}: ClipboardIndicatorProps) {
  const { copied } = useClipboardContext("ClipboardIndicator")
  const idleSlot = fallback ?? children
  return (
    <span
      className={cn("dr-clipboard-indicator", className)}
      data-copied={copied ? "true" : "false"}
      {...props}
    >
      {copied ? copiedSlot : idleSlot}
    </span>
  )
}

export {
  Clipboard,
  ClipboardLabel,
  ClipboardControl,
  ClipboardInput,
  ClipboardTrigger,
  ClipboardIndicator,
}
