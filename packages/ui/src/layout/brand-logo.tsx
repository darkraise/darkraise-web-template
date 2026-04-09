import { useState } from "react"
import { cn } from "../lib/utils"
import { useBrandStore } from "./brand-store"

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

export function BrandLogo({ collapsed = false, className }: BrandLogoProps) {
  const appName = useBrandStore((s) => s.appName)
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {failed ? (
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <span className="text-primary-foreground text-sm font-medium">
            {appName.charAt(0).toUpperCase()}
          </span>
        </div>
      ) : (
        <img
          src="/logo.svg"
          alt={appName}
          className="h-8 w-8 shrink-0 rounded-md object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {!collapsed && (
        <span className="truncate text-lg font-medium">{appName}</span>
      )}
    </div>
  )
}
