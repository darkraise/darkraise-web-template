import * as React from "react"
import { LoaderCircle } from "lucide-react"
import { Slot } from "@primitives/slot"

import { cn } from "@lib/utils"
import "./button.css"

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  /**
   * Async work is in flight. Disables the button so the action cannot be
   * fired twice, marks it `aria-busy`, and shows a spinner beside the label.
   *
   * Under `asChild` the spinner is not injected — Slot renders a single child
   * and owns its own markup — but the disabled and busy semantics still apply.
   */
  loading?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  type,
  children,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  // Default <button> elements to type="button"; the HTML default is "submit",
  // which silently submits the parent form on click.
  const resolvedType = asChild ? type : (type ?? "button")
  return (
    <Comp
      ref={ref}
      type={resolvedType}
      className={cn("dr-btn", className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      // Slot forwards to whatever element the consumer supplied, which may not
      // accept `disabled` at all (an anchor, for instance), so the busy state
      // is expressed through aria there instead.
      disabled={asChild ? undefined : (disabled ?? loading)}
      aria-disabled={asChild && (disabled || loading) ? true : undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          )}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button }
