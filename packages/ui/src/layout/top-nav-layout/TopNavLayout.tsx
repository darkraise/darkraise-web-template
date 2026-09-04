import { useRouterAdapter } from "@router"
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

export function TopNavLayout({
  children,
  nav,
  headerSlot,
  sidebarHeader,
  sidebarFooter,
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
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
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
            group.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="dr-top-nav-layout-nav-item"
                activeClassName="active"
                activeExact={item.href === "/"}
              >
                {item.icon && <item.icon className="size-[var(--icon-size)]" />}
                {item.label}
              </Link>
            )),
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
