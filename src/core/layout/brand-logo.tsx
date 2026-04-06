import { useState, useEffect } from "react"
import { cn } from "@/core/lib/utils"
import { useBrandStore } from "./brand-store"

const LOGO_CANDIDATES = ["/logo.svg", "/logo.png", "/logo.webp", "/logo.jpg"]

function useLogoSrc() {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function findLogo() {
      for (const candidate of LOGO_CANDIDATES) {
        try {
          const res = await fetch(candidate, { method: "HEAD" })
          if (res.ok && !cancelled) {
            setSrc(candidate)
            return
          }
        } catch {
          // continue to next candidate
        }
      }
    }

    void findLogo()
    return () => {
      cancelled = true
    }
  }, [])

  return src
}

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
}

export function BrandLogo({ collapsed = false, className }: BrandLogoProps) {
  const logoSrc = useLogoSrc()
  const appName = useBrandStore((s) => s.appName)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={appName}
          className="h-8 w-8 shrink-0 rounded-md object-contain"
        />
      ) : (
        <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          <span className="text-primary-foreground text-sm font-medium">
            {appName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {!collapsed && (
        <span className="truncate text-lg font-medium">{appName}</span>
      )}
    </div>
  )
}
