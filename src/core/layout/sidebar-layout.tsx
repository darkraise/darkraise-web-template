import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { cn } from "@/core/lib/utils"
import { Button } from "@/core/components/ui/button"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { TooltipProvider } from "@/core/components/ui/tooltip"
import { BrandLogo } from "./brand-logo"
import { LayoutHeader } from "./layout-header"
import { SidebarNav } from "./sidebar-nav"
import type { LayoutProps } from "./types"

export function SidebarLayout({ children, nav, headerSlot }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        <aside
          className={cn(
            "sidebar-gradient-overlay theme-transition bg-surface-sidebar hidden flex-col border-r transition-all duration-300 md:flex",
            collapsed ? "w-16" : "w-64",
          )}
          style={{ borderColor: "hsl(var(--sidebar-border))" }}
        >
          <div
            className={cn(
              "flex h-14 items-center border-b px-4",
              collapsed && "justify-center px-0",
            )}
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            {collapsed ? (
              <BrandLogo />
            ) : (
              <span
                className="text-lg font-medium"
                style={{ color: "hsl(var(--sidebar-foreground-hover))" }}
              >
                App
              </span>
            )}
          </div>

          <ScrollArea className="flex-1 py-4">
            <SidebarNav nav={nav} collapsed={collapsed} />
          </ScrollArea>

          <div
            className="border-t p-2"
            style={{ borderColor: "hsl(var(--sidebar-border))" }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="sidebar-nav-item w-full"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <LayoutHeader
            nav={nav}
            headerSlot={headerSlot}
            className="header-gradient-overlay theme-transition"
          />
          <main className="flex-1 overflow-y-auto p-6" data-content>
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
