import { useState } from "react"
import { cn } from "@lib/utils"
import { useBrandStore } from "@layout/brandStore"

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

export function BrandLogo({ collapsed = false, className }: BrandLogoProps) {
  const appName = useBrandStore((s) => s.appName)
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn("dr-brand-logo", className)}
      data-collapsed={collapsed ? "true" : undefined}
    >
      {failed ? (
        <div className="dr-brand-logo-mark">
          <span className="dr-brand-logo-mark-text">
            {appName.charAt(0).toUpperCase()}
          </span>
        </div>
      ) : (
        <img
          src="/logo.svg"
          alt={appName}
          className="dr-brand-logo-image"
          onError={() => setFailed(true)}
        />
      )}
      {!collapsed && <span className="dr-brand-logo-label">{appName}</span>}
    </div>
  )
}
