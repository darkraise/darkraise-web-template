import { useRouterAdapter } from "@router"
import { SearchCommand } from "@layout/search-command"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SkipLink } from "@layout/skip-link"
import { flattenNavItems } from "@layout/navTree"
import type { LayoutProps } from "@layout/types"

export function TopNavLayout({
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
  const flatNavItems = flattenNavItems(nav)

  const { Link } = useRouterAdapter()

  return (
    <div className="dr-top-nav-layout">
      <SkipLink />
      <LayoutHeader
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
        className="dr-top-nav-layout-content"
      >
        {children}
      </main>
    </div>
  )
}
