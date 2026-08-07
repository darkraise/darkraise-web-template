import { useState } from "react"
import { PanelLeftClose, PanelLeft, SeparatorVertical } from "lucide-react"
import { Button } from "@components/button"
import { Toggle } from "@components/toggle"
import { TooltipProvider } from "@components/tooltip"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SearchCommand } from "@layout/search-command"
import { SkipLink } from "@layout/skip-link"
import { SidebarNav } from "./SidebarNav"
import { SidebarProvider } from "./SidebarContext"
import type { LayoutProps } from "@layout/types"

export function SidebarLayout({
  children,
  nav,
  headerSlot,
  sidebarHeader,
  sidebarFooter,
  showLayoutSwitcher,
  showThemeSwitcher,
  showActiveBarToggle = false,
  user,
  onProfile,
  onSettings,
  onLogout,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeBar, setActiveBar] = useState(true)

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  const activeBarToggle = showActiveBarToggle ? (
    <Toggle
      size="sm"
      pressed={activeBar}
      onPressedChange={setActiveBar}
      aria-label="Toggle sidebar active-item left bar"
      title="Sidebar active-item left bar"
    >
      <SeparatorVertical className="size-[var(--icon-size)]" />
    </Toggle>
  ) : null

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider collapsed={collapsed}>
        <div className="dr-sidebar-layout">
          <SkipLink />
          <aside
            aria-label="Primary"
            aria-expanded={!collapsed}
            className="dr-sidebar-layout-aside sidebar-gradient-overlay theme-transition bg-surface-sidebar"
            data-collapsed={collapsed ? "true" : undefined}
          >
            <div className="dr-sidebar-layout-aside-header">
              {!collapsed && <BrandLogo collapsed={false} />}
              <Button
                variant="ghost"
                size="icon"
                className="dr-sidebar-nav-item dr-sidebar-layout-toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeft className="size-[var(--icon-size)]" />
                ) : (
                  <PanelLeftClose className="size-[var(--icon-size)]" />
                )}
              </Button>
            </div>

            <div className="dr-sidebar-layout-search">
              <SearchCommand navItems={flatNavItems} collapsed={collapsed} />
            </div>

            {sidebarHeader && (
              <div className="dr-sidebar-layout-aside-section">
                {sidebarHeader}
              </div>
            )}

            <div className="dr-sidebar-layout-nav-scroll">
              <SidebarNav nav={nav} activeBar={activeBar} />
            </div>

            {sidebarFooter && (
              <div
                className="dr-sidebar-layout-aside-section"
                data-position="footer"
              >
                {sidebarFooter}
              </div>
            )}
          </aside>

          <div className="dr-sidebar-layout-main">
            <LayoutHeader
              nav={nav}
              sidebarHeader={sidebarHeader}
              sidebarFooter={sidebarFooter}
              headerSlot={
                <>
                  {activeBarToggle}
                  {headerSlot}
                </>
              }
              className="header-gradient-overlay theme-transition"
              showLayoutSwitcher={showLayoutSwitcher}
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
              className="dr-sidebar-layout-content"
              data-content
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
