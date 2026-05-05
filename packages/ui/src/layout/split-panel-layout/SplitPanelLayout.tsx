import { useState, useCallback, useRef } from "react"
import { cn } from "../../lib/utils"
import { useEventListener } from "../../hooks"
import { SearchCommand } from "../search-command"
import { BrandLogo } from "../brand-logo"
import { LayoutHeader } from "../layout-header"
import type { LayoutProps } from "../types"
import type { ReactNode } from "react"

interface SplitPanelLayoutProps extends LayoutProps {
  panel: ReactNode
  defaultPanelWidth?: number
  minPanelWidth?: number
  maxPanelWidth?: number
}

export function SplitPanelLayout({
  children,
  nav,
  headerSlot,
  showLayoutSwitcher,
  showThemeSwitcher,
  user,
  onLogout,
  panel,
  defaultPanelWidth = 320,
  minPanelWidth = 240,
  maxPanelWidth = 480,
}: SplitPanelLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth)
  const [isDragging, setIsDragging] = useState(false)
  const docRef = useRef(typeof document !== "undefined" ? document : null)

  useEventListener(docRef, "mousemove", (e: MouseEvent) => {
    if (!isDragging) return
    const width = Math.min(Math.max(e.clientX, minPanelWidth), maxPanelWidth)
    setPanelWidth(width)
  })

  useEventListener(docRef, "mouseup", () => {
    if (isDragging) setIsDragging(false)
  })

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LayoutHeader
        nav={nav}
        headerSlot={headerSlot}
        className="gap-4"
        showLayoutSwitcher={showLayoutSwitcher}
        showThemeSwitcher={showThemeSwitcher}
        user={user}
        onLogout={onLogout}
      >
        <BrandLogo />
        <SearchCommand
          navItems={nav.flatMap((g) =>
            g.items.map((i) => ({ label: i.label, href: i.href })),
          )}
        />
      </LayoutHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div
          className="border-border flex-shrink-0 overflow-y-auto border-r"
          style={{ width: panelWidth }}
        >
          {panel}
        </div>

        {/* Resize handle */}
        <div
          className={cn(
            "hover:bg-primary/20 w-1 cursor-col-resize bg-transparent transition-colors",
            isDragging && "bg-primary/30",
          )}
          onMouseDown={handleMouseDown}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
