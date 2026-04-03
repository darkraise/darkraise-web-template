import { Link } from "@tanstack/react-router"
import { cn } from "@/core/lib/utils"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"

export function TopNavLayout({ children, nav, headerSlot }: LayoutProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 items-center gap-4 border-b border-border bg-surface-header px-4">
        <MobileDrawer nav={nav} />
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="text-sm font-medium text-primary-foreground">A</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.flatMap((group) =>
            group.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground",
                )}
                activeProps={{ className: "active" }}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchCommand navItems={flatNavItems} />
          {headerSlot}
          <ThemeSwitcher />
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
