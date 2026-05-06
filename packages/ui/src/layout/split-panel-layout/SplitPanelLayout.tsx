import { useState, useCallback, useRef } from "react"
import { useEventListener } from "@hooks"
import { SearchCommand } from "@layout/search-command"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import type { LayoutProps } from "@layout/types"
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
    <div className="dr-split-panel-layout">
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

      <div className="dr-split-panel-layout-body">
        <div
          className="dr-split-panel-layout-aside"
          style={{ width: panelWidth }}
        >
          {panel}
        </div>

        <div
          className="dr-split-panel-layout-handle"
          data-dragging={isDragging ? "true" : undefined}
          onMouseDown={handleMouseDown}
        />

        <main className="dr-split-panel-layout-content">{children}</main>
      </div>
    </div>
  )
}
