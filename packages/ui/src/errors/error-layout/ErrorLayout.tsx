import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

interface ErrorLayoutProps {
  icon: ReactNode
  title: string
  description: string
  code?: string
  children?: ReactNode
  className?: string
}

export function ErrorLayout({
  icon,
  title,
  description,
  code,
  children,
  className,
}: ErrorLayoutProps) {
  return (
    <div className={cn("dr-error-layout", className)}>
      <div className="dr-error-layout-content">
        <div className="dr-error-layout-icon">{icon}</div>
        {code && <p className="dr-error-layout-code">{code}</p>}
        <h1 className="dr-error-layout-title">{title}</h1>
        <p className="dr-error-layout-description">{description}</p>
        {children && <div className="dr-error-layout-actions">{children}</div>}
      </div>
    </div>
  )
}
