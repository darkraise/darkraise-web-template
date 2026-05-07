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
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEventListener(docRef, "pointermove", (e: PointerEvent) => {
    if (!isDragging) return
    const body = bodyRef.current
    if (!body) return
    // Width is measured from the body container's left edge, not the
    // viewport, so the drag works correctly when the layout is offset by
    // a sidebar, padding, or any horizontally-scrolled ancestor.
    const left = body.getBoundingClientRect().left
    const width = Math.min(
      Math.max(e.clientX - left, minPanelWidth),
      maxPanelWidth,
    )
    setPanelWidth(width)
  })

  const stopDragging = useCallback(() => {
    setIsDragging((prev) => (prev ? false : prev))
  }, [])

  useEventListener(docRef, "pointerup", stopDragging)
  useEventListener(docRef, "pointercancel", stopDragging)

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setIsDragging(true)
    },
    [],
  )

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

      <div ref={bodyRef} className="dr-split-panel-layout-body">
        <div
          className="dr-split-panel-layout-aside"
          style={{ width: panelWidth }}
        >
          {panel}
        </div>

        <div
          className="dr-split-panel-layout-handle"
          data-dragging={isDragging ? "true" : undefined}
          onPointerDown={handlePointerDown}
          // touch-action: none keeps a touch drag on the handle from
          // scrolling the page or triggering platform gestures.
          style={{ touchAction: "none" }}
        />

        <main className="dr-split-panel-layout-content">{children}</main>
      </div>
    </div>
  )
}
