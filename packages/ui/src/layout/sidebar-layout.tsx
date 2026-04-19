import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "../components/button"
import { ScrollArea } from "../components/scroll-area"
import { TooltipProvider } from "../components/tooltip"
import { BrandLogo } from "./brand-logo"
import { LayoutHeader } from "./layout-header"
import { SidebarNav } from "./sidebar-nav"
import type { LayoutProps } from "./types"

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
  const sidebarBorder = { borderColor: "hsl(var(--sidebar-border))" }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        <aside
          className={cn(
            "sidebar-gradient-overlay theme-transition bg-surface-sidebar hidden flex-col border-r transition-all duration-300 md:flex",
            collapsed ? "w-16" : "w-64",
          )}
          style={sidebarBorder}
        >
          <div
            className={cn(
              "flex h-14 items-center border-b",
              collapsed ? "justify-center px-2" : "justify-between px-4",
            )}
            style={sidebarBorder}
          >
            {!collapsed && <BrandLogo collapsed={false} />}
            <Button
              variant="ghost"
              size="icon"
              className="sidebar-nav-item h-8 w-8"
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
            <div
              className={cn("border-b", collapsed ? "px-2 py-2" : "px-3 py-3")}
              style={sidebarBorder}
            >
              {sidebarHeader}
            </div>
          )}

          <ScrollArea className="flex-1 py-4">
            <SidebarNav nav={nav} collapsed={collapsed} />
          </ScrollArea>

          {sidebarFooter && (
            <div
              className={cn("border-t", collapsed ? "px-2 py-2" : "px-3 py-3")}
              style={sidebarBorder}
            >
              {sidebarFooter}
            </div>
          )}
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <LayoutHeader
            nav={nav}
            headerSlot={headerSlot}
            className="header-gradient-overlay theme-transition"
            showLayoutSwitcher={showLayoutSwitcher}
            showThemeSwitcher={showThemeSwitcher}
            user={user}
            onLogout={onLogout}
          />
          <main className="flex-1 overflow-y-auto p-6" data-content>
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
