import * as React from "react"

import { Button } from "../button"
import { cn } from "../../lib/utils"
import "./clipboard.css"

export interface ClipboardCopyDetails {
  copied: boolean
  value: string
  error?: Error
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
}

function Clipboard({
  className,
  value,
  timeout = 2000,
  onCopyStatusChange,
  children,
  ...props
}: ClipboardProps) {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const onStatusChangeRef = React.useRef(onCopyStatusChange)

  React.useEffect(() => {
    onStatusChangeRef.current = onCopyStatusChange
  }, [onCopyStatusChange])

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const copy = React.useCallback(() => {
    void (async () => {
      try {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        onStatusChangeRef.current?.({ copied: true, value })
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setCopied(false)
          onStatusChangeRef.current?.({ copied: false, value })
        }, timeout)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onStatusChangeRef.current?.({ copied: false, value, error })
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
      aria-hidden="true"
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
