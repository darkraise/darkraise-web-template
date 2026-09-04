import { useState, useCallback, useRef } from "react"
import { useEventListener, useSeparatorA11y } from "@hooks"
import { SearchCommand } from "@layout/search-command"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SkipLink } from "@layout/skip-link"
import { useRouteFocus } from "@layout/useRouteFocus"
import { flattenNavItems } from "@layout/navTree"
import type { LayoutProps } from "@layout/types"
import { useShellStyle } from "@layout/shell"
import type { ShellStyle } from "@theme"
import { useUiLabels } from "@labels"
import type { CSSProperties, ReactNode } from "react"

export interface SplitPanelLayoutProps extends LayoutProps {
  panel: ReactNode
  /** Pins this shell's chrome treatment, overriding the theme axis. */
  shellStyle?: ShellStyle
  defaultPanelWidth?: number
  minPanelWidth?: number
  maxPanelWidth?: number
}

export function SplitPanelLayout({
  children,
  nav,
  headerSlot,
  sidebarHeader,
  sidebarFooter,
  showLayoutSwitcher,
  showThemeSwitcher,
  user,
  onProfile,
  onSettings,
  onLogout,
  shellStyle: shellStyleProp,
  panel,
  defaultPanelWidth = 320,
  minPanelWidth = 240,
  maxPanelWidth = 480,
}: SplitPanelLayoutProps) {
  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp)
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth)
  useRouteFocus()
  const [isDragging, setIsDragging] = useState(false)
  const docRef = useRef(typeof document !== "undefined" ? document : null)
  const shellRef = useRef<HTMLDivElement | null>(null)

  const clampWidth = useCallback(
    (width: number) => Math.min(Math.max(width, minPanelWidth), maxPanelWidth),
    [minPanelWidth, maxPanelWidth],
  )

  useEventListener(docRef, "pointermove", (e: PointerEvent) => {
    if (!isDragging) return
    const shell = shellRef.current
    if (!shell) return
    // Width is measured from the shell's left edge, not the viewport, so the
    // drag works correctly when the layout is offset by padding or by any
    // horizontally-scrolled ancestor.
    const left = shell.getBoundingClientRect().left
    setPanelWidth(clampWidth(e.clientX - left))
  })

  const stopDragging = useCallback(() => {
    setIsDragging((prev) => (prev ? false : prev))
  }, [])

  useEventListener(docRef, "pointerup", stopDragging)
  useEventListener(docRef, "pointercancel", stopDragging)

  const separator = useSeparatorA11y({
    orientation: "horizontal",
    valueNow: Math.round(
      ((panelWidth - minPanelWidth) / (maxPanelWidth - minPanelWidth)) * 100,
    ),
    onNudge: (deltaPercent) =>
      setPanelWidth((prev) =>
        clampWidth(
          prev + ((maxPanelWidth - minPanelWidth) * deltaPercent) / 100,
        ),
      ),
    onJump: (edge) =>
      setPanelWidth(edge === "min" ? minPanelWidth : maxPanelWidth),
  })

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setIsDragging(true)
    },
    [],
  )

  return (
    <div
      ref={shellRef}
      className="dr-shell dr-split-panel-layout"
      data-structure="split-panel"
      data-shell-style={shellStyle}
      style={{ "--panel-width": `${panelWidth}px` } as CSSProperties}
    >
      <SkipLink>{labels.layout.skipToContent}</SkipLink>
      <LayoutHeader
        data-region="bar"
        nav={nav}
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        headerSlot={headerSlot}
        className="gap-4"
        showLayoutSwitcher={showLayoutSwitcher}
        showThemeSwitcher={showThemeSwitcher}
        user={user}
        onProfile={onProfile}
        onSettings={onSettings}
        onLogout={onLogout}
      >
        <BrandLogo />
        <SearchCommand navItems={flattenNavItems(nav)} />
      </LayoutHeader>

      <div data-region="panel" className="dr-split-panel-layout-aside">
        {panel}
      </div>

      <div
        {...separator}
        data-region="handle"
        className="dr-split-panel-layout-handle"
        data-dragging={isDragging ? "true" : undefined}
        onPointerDown={handlePointerDown}
        // touch-action: none keeps a touch drag on the handle from
        // scrolling the page or triggering platform gestures.
        style={{ touchAction: "none" }}
      />

      <main
        id="main-content"
        tabIndex={-1}
        data-region="content"
        data-content
        className="dr-split-panel-layout-content"
      >
        {children}
      </main>
    </div>
  )
}
