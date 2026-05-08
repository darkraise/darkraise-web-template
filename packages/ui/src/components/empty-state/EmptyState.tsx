import * as React from "react"
import { cn } from "@lib/utils"
import "./empty-state.css"

export interface EmptyStateProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...rest
}: EmptyStateProps) {
  return (
    <div className={cn("dr-empty-state", className)} {...rest}>
      {icon ? <div className="dr-empty-state-icon">{icon}</div> : null}
      <h3 className="dr-empty-state-title">{title}</h3>
      {description ? (
        <p className="dr-empty-state-description">{description}</p>
      ) : null}
      {action ? <div className="dr-empty-state-action">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
