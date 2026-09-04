import { ChevronDown } from "lucide-react"
import { useRouterAdapter } from "@router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
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

export interface TopNavLayoutProps extends LayoutProps {
  /** Pins this shell's chrome treatment, overriding the theme axis. */
  shellStyle?: ShellStyle
}

/**
 * Horizontal navigation in the app bar.
 *
 * Two documented limits: an item's `children` render as a one-level dropdown,
 * so grandchildren are dropped rather than nested, and the bar scrolls
 * horizontally when the items outgrow it rather than collapsing into an
 * overflow menu.
 */
export function TopNavLayout({
  children,
  nav,
  headerSlot,
  navHeader,
  navFooter,
  // Accepting the deprecated names is what makes them aliases; the rule is
  // aimed at callers, not at the shim that keeps them working.
  /* eslint-disable @typescript-eslint/no-deprecated */
  sidebarHeader,
  sidebarFooter,
  /* eslint-enable @typescript-eslint/no-deprecated */
  showLayoutSwitcher,
  showThemeSwitcher,
  shellStyle: shellStyleProp,
  user,
  onProfile,
  onSettings,
  onLogout,
}: TopNavLayoutProps) {
  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp)
  // The sidebar* names predate the layouts that have no sidebar; both still
  // work, and the new name wins when a caller passes each.
  const resolvedNavHeader = navHeader ?? sidebarHeader
  const resolvedNavFooter = navFooter ?? sidebarFooter
  const flatNavItems = flattenNavItems(nav)

  const { Link } = useRouterAdapter()
  useRouteFocus()

  return (
    <div
      className="dr-shell dr-top-nav-layout"
      data-structure="top-nav"
      data-shell-style={shellStyle}
    >
      <SkipLink>{labels.layout.skipToContent}</SkipLink>
      <LayoutHeader
        data-region="bar"
        nav={nav}
        sidebarHeader={resolvedNavHeader}
        sidebarFooter={resolvedNavFooter}
        className="gap-4"
        showLayoutSwitcher={showLayoutSwitcher}
        showThemeSwitcher={showThemeSwitcher}
        user={user}
        onProfile={onProfile}
        onSettings={onSettings}
        onLogout={onLogout}
        headerSlot={
          <>
            <SearchCommand navItems={flatNavItems} />
            {headerSlot}
          </>
        }
      >
        <BrandLogo />
        <nav aria-label="Primary" className="dr-top-nav-layout-nav">
          {nav.flatMap((group) =>
            group.items.map((item) =>
              item.children?.length ? (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="dr-top-nav-layout-nav-item"
                    >
                      {item.icon && (
                        <item.icon className="size-[var(--icon-size)]" />
                      )}
                      {item.label}
                      <ChevronDown
                        className="dr-top-nav-layout-nav-chevron"
                        aria-hidden="true"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {/* The parent is a route in its own right, so it leads its
                        own menu — the same contract SidebarNav's collapsed
                        popover uses. */}
                    <DropdownMenuItem asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link to={child.href}>{child.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="dr-top-nav-layout-nav-item"
                  activeClassName="active"
                  activeExact={item.href === "/"}
                >
                  {item.icon && (
                    <item.icon className="size-[var(--icon-size)]" />
                  )}
                  {item.label}
                </Link>
              ),
            ),
          )}
        </nav>
      </LayoutHeader>

      <main
        id="main-content"
        tabIndex={-1}
        data-region="content"
        data-content
        className="dr-top-nav-layout-content"
      >
        {children}
      </main>
    </div>
  )
}
