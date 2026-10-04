import { useRef } from "react"
import { useUiText } from "../../i18n/useUiText"
import { useRouterAdapter } from "@router"
import { cn } from "@lib/utils"
import { SidebarItem, SidebarProvider } from "@layout/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/tooltip"
import { LayoutHeader } from "@layout/layout-header"
import { SkipLink } from "@layout/skip-link"
import { useRouteFocus } from "@layout/useRouteFocus"
import { containsItem, findActiveItem } from "@layout/navTree"
import { ActiveNavItemContext } from "@layout/sidebar/active-nav-context"
import { useNavIndicator } from "@layout/sidebar/useNavIndicator"
import type { LayoutProps } from "@layout/types"
import { BrandLogo } from "@layout/brand-logo"
import {
  useShellStyle,
  useSidebarSelection,
  useSidebarShadow,
} from "@layout/shell"
import type { ShellStyle } from "@theme"
import { useUiLabels } from "@labels"

export interface StackedLayoutProps extends LayoutProps {
  /**
   * Pins this shell's chrome treatment over the user's pick, and hides the
   * shell-style choice in this layout's switcher.
   */
  shellStyle?: ShellStyle
}

export function StackedLayout({
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
  shellStyle: shellStyleProp,
  defaultShellStyle,
  user,
  onProfile,
  onSettings,
  onLogout,
}: StackedLayoutProps) {
  const uiText = useUiText()

  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp, defaultShellStyle)
  // The sidebar* names predate the layouts that have no sidebar; both still
  // work, and the new name wins when a caller passes each.
  const resolvedNavHeader = navHeader ?? sidebarHeader
  const resolvedNavFooter = navFooter ?? sidebarFooter
  const { Link, usePathname } = useRouterAdapter()
  useRouteFocus()
  const currentPath = usePathname()

  // The rail and aside items are sidebar nav items without a SidebarNav
  // ancestor, so the layout stamps the look and runs the indicators itself.
  const look = useSidebarSelection()
  const shadow = useSidebarShadow()
  const railRef = useRef<HTMLElement>(null)
  const railIndicatorRef = useRef<HTMLSpanElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const asideIndicatorRef = useRef<HTMLSpanElement>(null)
  useNavIndicator(railRef, railIndicatorRef, currentPath)
  useNavIndicator(asideRef, asideIndicatorRef, currentPath)
  // One active item across every group, so two groups with overlapping
  // prefixes never both claim the route and the longest match picks the
  // sub-nav.
  const activeItem = findActiveItem(
    nav.flatMap((group) => group.items),
    currentPath,
  )
  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => containsItem(item, activeItem)),
  )
  // When the current route does not match any nav group, don't fall back
  // to nav[0] — that surfaces the first group's items in the sub-nav
  // panel and marks its rail icon as active, which lies to the user
  // about where they are. Render nothing instead.
  const activeGroup = activeGroupIndex >= 0 ? nav[activeGroupIndex] : undefined

  return (
    <TooltipProvider>
      {/* SidebarItem reads `collapsed` from SidebarContext via useSidebar();
       * the stacked layout's sub-nav is always shown fully expanded, so
       * we wrap with collapsed={false}. Without this, mounting the layout
       * throws "useSidebar must be used within a <SidebarProvider>". */}
      <SidebarProvider collapsed={false}>
        <div
          className="dr-shell dr-stacked-layout"
          data-structure="stacked"
          data-shell-style={shellStyle}
        >
          <SkipLink>{labels.layout.skipToContent}</SkipLink>
          {/* Icon sidebar */}
          <aside data-region="nav" className="dr-stacked-layout-rail">
            <div className="dr-stacked-layout-rail-logo">
              <BrandLogo collapsed />
            </div>
            <nav
              aria-label={uiText("Primary")}
              ref={railRef}
              className="dr-stacked-layout-rail-nav"
              data-sidebar-selection={look}
              data-sidebar-shadow={shadow}
              data-indicator="pending"
            >
              <span
                ref={railIndicatorRef}
                className="dr-sidebar-nav-indicator"
                aria-hidden="true"
              />
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
                        className={cn(
                          "dr-sidebar-nav-item dr-stacked-layout-rail-item",
                          isActive && "dr-sidebar-nav-current",
                        )}
                        activeExact
                        data-status={isActive ? "active" : undefined}
                        // This layout resolves active state itself, so it
                        // states the current page rather than relying on
                        // the router adapter to do it.
                        aria-current={isActive ? "page" : undefined}
                      >
                        {Icon && (
                          <span className="dr-sidebar-nav-icon size-[var(--icon-size-lg)]">
                            <Icon className="dr-sidebar-nav-icon-svg size-[var(--icon-size-lg)]" />
                          </span>
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
            <aside data-region="subnav" className="dr-stacked-layout-aside">
              {activeGroup.label && (
                <div data-seam className="dr-stacked-layout-aside-header">
                  <p className="dr-stacked-layout-aside-label">
                    {activeGroup.label}
                  </p>
                </div>
              )}
              <div className="dr-stacked-layout-aside-scroll">
                <nav
                  aria-label={uiText("Secondary")}
                  ref={asideRef}
                  className="dr-stacked-layout-aside-nav"
                  data-sidebar-selection={look}
                  data-sidebar-shadow={shadow}
                  data-indicator="pending"
                >
                  <span
                    ref={asideIndicatorRef}
                    className="dr-sidebar-nav-indicator"
                    aria-hidden="true"
                  />
                  <ActiveNavItemContext.Provider value={activeItem}>
                    {activeGroup.items.map((item) => (
                      <SidebarItem key={item.href} item={item} />
                    ))}
                  </ActiveNavItemContext.Provider>
                </nav>
              </div>
            </aside>
          )}

          <LayoutHeader
            notificationSlot={notificationSlot}
            data-region="bar"
            nav={nav}
            sidebarHeader={resolvedNavHeader}
            sidebarFooter={resolvedNavFooter}
            headerSlot={headerSlot}
            showLayoutSwitcher={showLayoutSwitcher}
            layoutVariants={layoutVariants}
            shellStylePinned={shellStyleProp !== undefined}
            currentShellStyle={shellStyle}
            showThemeSwitcher={showThemeSwitcher}
            user={user}
            onProfile={onProfile}
            onSettings={onSettings}
            onLogout={onLogout}
          />

          <main
            id="main-content"
            tabIndex={-1}
            data-region="content"
            data-content
            className="dr-stacked-layout-content"
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
