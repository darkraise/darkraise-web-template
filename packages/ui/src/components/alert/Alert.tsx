import * as React from "react"

import { cn } from "../../lib/utils"
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

function AlertTitle({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.Ref<HTMLParagraphElement>
}) {
  return <h5 ref={ref} className={cn("dr-alert-title", className)} {...props} />
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
