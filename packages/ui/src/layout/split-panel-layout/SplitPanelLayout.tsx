import { useState, useCallback, useEffect, useRef } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@components/button"
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
  /**
   * Pins this shell's chrome treatment over the user's pick, and hides the
   * shell-style choice in this layout's switcher.
   */
  shellStyle?: ShellStyle
  defaultPanelWidth?: number
  minPanelWidth?: number
  maxPanelWidth?: number
  /**
   * Below 768px, whether the content replaces the panel. The panel shows
   * first; pass true once the user opens an item.
   */
  contentActive?: boolean
  /** Below 768px, renders a Back button above the content that calls this. */
  onBack?: () => void
}

export function SplitPanelLayout({
  children,
  nav,
  headerSlot,
  notificationSlot,
  navHeader,
  navFooter,
  // Accepting the deprecated names is what makes them aliases; the rule is
  // aimed at callers, not at the shim that keeps them working.
  /* eslint-disable @typescript-eslint/no-deprecated */
  sidebarHeader,
  sidebarFooter,
  /* eslint-enable @typescript-eslint/no-deprecated */
  showLayoutSwitcher,
  layoutVariants,
  showThemeSwitcher,
  user,
  onProfile,
  onSettings,
  onLogout,
  shellStyle: shellStyleProp,
  defaultShellStyle,
  panel,
  defaultPanelWidth = 320,
  minPanelWidth = 240,
  maxPanelWidth = 480,
  contentActive = false,
  onBack,
}: SplitPanelLayoutProps) {
  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp, defaultShellStyle)
  // The sidebar* names predate the layouts that have no sidebar; both still
  // work, and the new name wins when a caller passes each.
  const resolvedNavHeader = navHeader ?? sidebarHeader
  const resolvedNavFooter = navFooter ?? sidebarFooter
  const [panelWidth, setPanelWidth] = useState(defaultPanelWidth)
  useRouteFocus()
  const [isDragging, setIsDragging] = useState(false)
  const docRef = useRef(typeof document !== "undefined" ? document : null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)
  const previousContentActive = useRef(contentActive)

  useEffect(() => {
    if (previousContentActive.current === contentActive) return
    previousContentActive.current = contentActive
    // Only the phone view swaps the regions; side by side, focus stays put.
    if (!window.matchMedia("(width < 48rem)").matches) return
    ;(contentActive ? mainRef.current : panelRef.current)?.focus()
  }, [contentActive])

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
      data-mobile-view={contentActive ? "content" : "panel"}
      style={{ "--panel-width": `${panelWidth}px` } as CSSProperties}
    >
      <SkipLink>{labels.layout.skipToContent}</SkipLink>
      <LayoutHeader
        notificationSlot={notificationSlot}
        data-region="bar"
        nav={nav}
        sidebarHeader={resolvedNavHeader}
        sidebarFooter={resolvedNavFooter}
        headerSlot={headerSlot}
        className="gap-4"
        showLayoutSwitcher={showLayoutSwitcher}
        layoutVariants={layoutVariants}
        shellStylePinned={shellStyleProp !== undefined}
        currentShellStyle={shellStyle}
        showThemeSwitcher={showThemeSwitcher}
        user={user}
        onProfile={onProfile}
        onSettings={onSettings}
        onLogout={onLogout}
      >
        <BrandLogo />
        <SearchCommand navItems={flattenNavItems(nav)} />
      </LayoutHeader>

      <div
        ref={panelRef}
        tabIndex={-1}
        data-region="panel"
        className="dr-split-panel-layout-aside"
      >
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
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        data-region="content"
        data-content
        className="dr-split-panel-layout-content"
      >
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="dr-split-panel-layout-back"
            onClick={onBack}
          >
            <ChevronLeft
              className="dr-split-panel-layout-back-icon size-[var(--icon-size)]"
              aria-hidden="true"
            />
            {labels.layout.back}
          </Button>
        )}
        {children}
      </main>
    </div>
  )
}
