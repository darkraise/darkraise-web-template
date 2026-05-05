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
    <div
      className={cn(
        "bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6",
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="text-muted-foreground mb-6">{icon}</div>
        {code && (
          <p className="text-muted-foreground mb-2 text-sm font-medium tracking-widest uppercase">
            {code}
          </p>
        )}
        <h1 className="mb-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mb-8 text-base leading-relaxed">
          {description}
        </p>
        {children && <div className="flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  )
}
