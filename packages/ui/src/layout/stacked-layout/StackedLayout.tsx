import { useRouterAdapter } from "@router"
import { SidebarItem, SidebarProvider } from "@layout/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/tooltip"
import { LayoutHeader } from "@layout/layout-header"
import { SkipLink } from "@layout/skip-link"
import { coversPath } from "@layout/navMatch"
import type { LayoutProps } from "@layout/types"

export function StackedLayout({
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
}: LayoutProps) {
  const { Link, usePathname } = useRouterAdapter()
  const currentPath = usePathname()

  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => coversPath(item, currentPath)),
  )
  // When the current route does not match any nav group, don't fall back
  // to nav[0] — that surfaces the first group's items in the sub-nav
  // panel and marks its rail icon as active, which lies to the user
  // about where they are. Render nothing instead.
  const activeGroup = activeGroupIndex >= 0 ? nav[activeGroupIndex] : undefined

  return (
    <TooltipProvider delayDuration={0}>
      {/* SidebarItem reads `collapsed` from SidebarContext via useSidebar();
       * the stacked layout's sub-nav is always shown fully expanded, so
       * we wrap with collapsed={false}. Without this, mounting the layout
       * throws "useSidebar must be used within a <SidebarProvider>". */}
      <SidebarProvider collapsed={false}>
        <div className="dr-stacked-layout">
          <SkipLink />
          {/* Icon sidebar */}
          <aside className="dr-stacked-layout-rail">
            <div className="dr-stacked-layout-rail-logo" />
            <nav className="dr-stacked-layout-rail-nav">
              {nav.map((group, gi) => {
                const firstItem = group.items[0]
                if (!firstItem) return null
                const Icon = firstItem.icon
                const isActive = gi === activeGroupIndex

                return (
                  <Tooltip key={gi}>
                    <TooltipTrigger asChild>
                      <Link
                        to={firstItem.href}
                        className="dr-sidebar-nav-item dr-stacked-layout-rail-item"
                        data-status={isActive ? "active" : undefined}
                      >
                        {Icon && (
                          <Icon className="size-[var(--icon-size-lg)]" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {group.label || firstItem.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </aside>

          {/* Sub-nav panel */}
          {activeGroup && (
            <aside className="dr-stacked-layout-aside">
              {activeGroup.label && (
                <div className="dr-stacked-layout-aside-header">
                  <p className="dr-stacked-layout-aside-label">
                    {activeGroup.label}
                  </p>
                </div>
              )}
              <div className="dr-stacked-layout-aside-scroll">
                <nav className="dr-stacked-layout-aside-nav">
                  {activeGroup.items.map((item) => (
                    <SidebarItem key={item.href} item={item} />
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main area */}
          <div className="dr-stacked-layout-main">
            <LayoutHeader
              nav={nav}
              sidebarHeader={sidebarHeader}
              sidebarFooter={sidebarFooter}
              headerSlot={headerSlot}
              showLayoutSwitcher={showLayoutSwitcher}
              showThemeSwitcher={showThemeSwitcher}
              user={user}
              onProfile={onProfile}
              onSettings={onSettings}
              onLogout={onLogout}
            />

            <main
              id="main-content"
              tabIndex={-1}
              className="dr-stacked-layout-content"
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
