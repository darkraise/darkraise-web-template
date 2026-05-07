import * as React from "react"

import { cn } from "@lib/utils"
import "./alert.css"

type AlertVariant = "default" | "destructive"

function Alert({
  className,
  variant = "default",
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      role="alert"
      data-variant={variant}
      className={cn("dr-alert", className)}
      {...props}
    />
  )
}

type AlertTitleHeading = "h2" | "h3" | "h4" | "h5" | "h6"

function AlertTitle({
  className,
  as: Heading = "h5",
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  /**
   * Heading level for the title. Defaults to `h5`; pick a level that fits the
   * surrounding document outline (e.g. `h2` for a top-level alert region).
   */
  as?: AlertTitleHeading
  ref?: React.Ref<HTMLHeadingElement>
}) {
  return (
    <Heading ref={ref} className={cn("dr-alert-title", className)} {...props} />
  )
}

function AlertDescription({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.Ref<HTMLParagraphElement>
}) {
  return (
    <div
      ref={ref}
      className={cn("dr-alert-description", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
