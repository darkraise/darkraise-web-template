import { useUiText } from "../../i18n/useUiText"
import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@components/button"
import { TooltipProvider } from "@components/tooltip"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SearchCommand } from "@layout/search-command"
import { SkipLink } from "@layout/skip-link"
import { useRouteFocus } from "@layout/useRouteFocus"
import { flattenNavItems } from "@layout/navTree"
import { SidebarNav } from "./SidebarNav"
import { SidebarProvider } from "./SidebarContext"
import type { LayoutProps } from "@layout/types"
import { useShellStyle } from "@layout/shell"
import type { ShellStyle, SidebarSelection } from "@theme"
import { useUiLabels } from "@labels"

export interface SidebarLayoutProps extends LayoutProps {
  /**
   * Look of the active nav row, pinned for this shell. Omitted, the theme's
   * `sidebarSelection` setting decides.
   */
  selection?: SidebarSelection
  /**
   * Pins this shell's chrome treatment over the user's pick, and hides the
   * shell-style choice in this layout's switcher.
   */
  shellStyle?: ShellStyle
}

export function SidebarLayout({
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
  selection,
  shellStyle: shellStyleProp,
  defaultShellStyle,
  user,
  onProfile,
  onSettings,
  onLogout,
}: SidebarLayoutProps) {
  const uiText = useUiText()

  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp, defaultShellStyle)
  // The sidebar* names predate the layouts that have no sidebar; both still
  // work, and the new name wins when a caller passes each.
  const resolvedNavHeader = navHeader ?? sidebarHeader
  const resolvedNavFooter = navFooter ?? sidebarFooter
  useRouteFocus()
  const [collapsed, setCollapsed] = useState(false)
  const flatNavItems = flattenNavItems(nav)

  const toggleButton = (
    <Button
      variant="ghost"
      size="icon"
      className="dr-sidebar-nav-item dr-sidebar-layout-toggle"
      onClick={() => setCollapsed(!collapsed)}
      aria-label={
        collapsed ? labels.layout.expandSidebar : labels.layout.collapseSidebar
      }
    >
      {collapsed ? (
        <PanelLeft
          className="dr-icon-inline size-[var(--icon-size)]"
          aria-hidden="true"
        />
      ) : (
        <PanelLeftClose
          className="dr-icon-inline size-[var(--icon-size)]"
          aria-hidden="true"
        />
      )}
    </Button>
  )

  return (
    <TooltipProvider>
      <SidebarProvider collapsed={collapsed}>
        <div
          className="dr-shell dr-sidebar-layout"
          data-structure="sidebar"
          data-shell-style={shellStyle}
        >
          <SkipLink>{labels.layout.skipToContent}</SkipLink>
          <aside
            aria-label={uiText("Primary")}
            aria-expanded={!collapsed}
            data-region="nav"
            className="dr-sidebar-layout-aside theme-transition"
            data-collapsed={collapsed ? "true" : undefined}
          >
            <div data-seam className="dr-sidebar-layout-aside-header">
              {collapsed ? (
                // One square is all the collapsed rail has, so the brand
                // mark and the toggle share it: the mark carries the app's
                // identity at rest and the toggle takes over on hover. The
                // button stays mounted and focusable throughout — only its
                // paint is deferred — because it is the only way back to
                // the expanded rail and a keyboard user has no hover.
                <div className="dr-sidebar-layout-brand-slot">
                  <BrandLogo collapsed />
                  {toggleButton}
                </div>
              ) : (
                <>
                  <BrandLogo collapsed={false} />
                  {toggleButton}
                </>
              )}
            </div>

            <div className="dr-sidebar-layout-search">
              <SearchCommand navItems={flatNavItems} collapsed={collapsed} />
            </div>

            {resolvedNavHeader && (
              <div data-seam className="dr-sidebar-layout-aside-section">
                {resolvedNavHeader}
              </div>
            )}

            <div className="dr-sidebar-layout-nav-scroll">
              <SidebarNav nav={nav} selection={selection} />
            </div>

            {resolvedNavFooter && (
              <div
                data-seam
                className="dr-sidebar-layout-aside-section"
                data-position="footer"
              >
                {resolvedNavFooter}
              </div>
            )}
          </aside>

          <LayoutHeader
            notificationSlot={notificationSlot}
            data-region="bar"
            nav={nav}
            sidebarHeader={resolvedNavHeader}
            sidebarFooter={resolvedNavFooter}
            sidebarSelection={selection}
            headerSlot={headerSlot}
            className="theme-transition"
            showLayoutSwitcher={showLayoutSwitcher}
            layoutVariants={layoutVariants}
            shellStylePinned={shellStyleProp !== undefined}
            currentShellStyle={shellStyle}
            showThemeSwitcher={showThemeSwitcher}
            /* Search lives in the rail for this layout. */
            showSearch={false}
            user={user}
            onProfile={onProfile}
            onSettings={onSettings}
            onLogout={onLogout}
          />
          <main
            id="main-content"
            tabIndex={-1}
            data-region="content"
            className="dr-sidebar-layout-content"
            data-content
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
