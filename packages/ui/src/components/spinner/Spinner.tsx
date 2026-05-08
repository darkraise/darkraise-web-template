import * as React from "react"
import { cn } from "@lib/utils"
import "./spinner.css"

export type SpinnerSize = "sm" | "md" | "lg"
export type SpinnerVariant = "default" | "primary" | "muted"

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize
  variant?: SpinnerVariant
  /** Visible label slot. Falls back to an `sr-only` "Loading" text when unset. */
  label?: React.ReactNode
}

function Spinner({
  className,
  size = "md",
  variant = "default",
  label,
  "aria-label": ariaLabel,
  ...rest
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      data-size={size}
      data-variant={variant}
      className={cn("dr-spinner", className)}
      {...rest}
    >
      <span className="dr-spinner-circle" aria-hidden="true" />
      {label !== undefined ? (
        label
      ) : !ariaLabel ? (
        <span className="sr-only">Loading</span>
      ) : null}
    </span>
  )
}

export { Spinner }
