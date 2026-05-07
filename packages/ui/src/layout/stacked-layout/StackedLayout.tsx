import { useRouterAdapter } from "@router"
import { SidebarItem } from "@layout/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/tooltip"
import { LayoutHeader } from "@layout/layout-header"
import type { LayoutProps } from "@layout/types"

export function StackedLayout({
  children,
  nav,
  headerSlot,
  showLayoutSwitcher,
  showThemeSwitcher,
  user,
  onLogout,
}: LayoutProps) {
  const { Link, usePathname } = useRouterAdapter()
  const currentPath = usePathname()

  const isPathMatch = (href: string) =>
    // Exact match, or a strict path-segment prefix — guards against
    // /settings matching /settings-old.
    currentPath === href || currentPath.startsWith(href + "/")
  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => isPathMatch(item.href)),
  )
  const activeGroup = nav[activeGroupIndex >= 0 ? activeGroupIndex : 0]

  return (
    <TooltipProvider delayDuration={0}>
      <div className="dr-stacked-layout">
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
                      {Icon && <Icon className="h-5 w-5" />}
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
            headerSlot={headerSlot}
            showLayoutSwitcher={showLayoutSwitcher}
            showThemeSwitcher={showThemeSwitcher}
            user={user}
            onLogout={onLogout}
          />

          <main className="dr-stacked-layout-content">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
