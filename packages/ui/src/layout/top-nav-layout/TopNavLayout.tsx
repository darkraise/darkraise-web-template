import { useRouterAdapter } from "@router"
import { SearchCommand } from "@layout/search-command"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import type { LayoutProps } from "@layout/types"

export function TopNavLayout({
  children,
  nav,
  headerSlot,
  showLayoutSwitcher,
  showThemeSwitcher,
  user,
  onLogout,
}: LayoutProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  const { Link } = useRouterAdapter()

  return (
    <div className="dr-top-nav-layout">
      <LayoutHeader
        nav={nav}
        className="gap-4"
        showLayoutSwitcher={showLayoutSwitcher}
        showThemeSwitcher={showThemeSwitcher}
        user={user}
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
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )),
          )}
        </nav>
      </LayoutHeader>

      <main className="dr-top-nav-layout-content">{children}</main>
    </div>
  )
}
