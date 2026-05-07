import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@components/button"
import { TooltipProvider } from "@components/tooltip"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
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
  user,
  onLogout,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider collapsed={collapsed}>
        <div className="dr-sidebar-layout">
          <aside
            aria-label="Primary"
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
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>

            {sidebarHeader && (
              <div className="dr-sidebar-layout-aside-section">
                {sidebarHeader}
              </div>
            )}

            <div className="dr-sidebar-layout-nav-scroll">
              <SidebarNav nav={nav} />
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
              headerSlot={headerSlot}
              className="header-gradient-overlay theme-transition"
              showLayoutSwitcher={showLayoutSwitcher}
              showThemeSwitcher={showThemeSwitcher}
              user={user}
              onLogout={onLogout}
            />
            <main className="dr-sidebar-layout-content" data-content>
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
