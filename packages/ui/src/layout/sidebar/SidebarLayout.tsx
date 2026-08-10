import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@components/button"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { TooltipProvider } from "@components/tooltip"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SearchCommand } from "@layout/search-command"
import { SkipLink } from "@layout/skip-link"
import { SidebarNav } from "./SidebarNav"
import type { SidebarActiveBar } from "./SidebarNav"
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
  // Starts unset so nobody's sidebar changes appearance unless they ask:
  // each preset renders its own default indicator until the control below
  // is touched. A single-selection ToggleGroup can't hold `undefined`
  // itself, so "unset" is represented on the wire as the "default" item
  // and mapped back to `undefined` in onValueChange.
  const [activeBar, setActiveBar] = useState<SidebarActiveBar | undefined>(
    undefined,
  )

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  const activeBarToggle = showActiveBarToggle ? (
    <ToggleGroup
      type="single"
      size="sm"
      value={activeBar ?? "default"}
      onValueChange={(value) => {
        // A single-selection group emits "" on deselect; that must not
        // reach state, or the control would end up with no active item.
        if (!value) return
        setActiveBar(
          value === "default" ? undefined : (value as SidebarActiveBar),
        )
      }}
      variant="outline"
      aria-label="Sidebar active-item indicator"
    >
      <ToggleGroupItem value="default" aria-label="Each preset's own indicator">
        Default
      </ToggleGroupItem>
      <ToggleGroupItem value="bar" aria-label="Left rail only">
        Bar
      </ToggleGroupItem>
      <ToggleGroupItem value="ring" aria-label="Uniform ring only">
        Ring
      </ToggleGroupItem>
      <ToggleGroupItem value="both" aria-label="Ring and left rail">
        Both
      </ToggleGroupItem>
    </ToggleGroup>
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
