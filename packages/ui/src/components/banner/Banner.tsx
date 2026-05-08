import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@lib/utils"
import "./banner.css"

export type BannerVariant =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "destructive"

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
  action?: React.ReactNode
}

function Banner({
  className,
  variant = "default",
  dismissible = false,
  onDismiss,
  icon,
  action,
  children,
  ...rest
}: BannerProps) {
  const role = variant === "destructive" ? "alert" : "region"
  return (
    <div
      role={role}
      data-variant={variant}
      className={cn("dr-banner", className)}
      {...rest}
    >
      {icon ? <span className="dr-banner-icon">{icon}</span> : null}
      <div className="dr-banner-content">{children}</div>
      {action ? <div className="dr-banner-action">{action}</div> : null}
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          className="dr-banner-close"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export { Banner }
