import type { ReactNode } from "react"
import { cn } from "@lib/utils"
import { ThemeSwitcher } from "@theme"
import { SearchCommand } from "@layout/search-command"
import { UserMenu } from "@layout/user-menu"
import { NotificationBell } from "@layout/notification-bell"
import { MobileDrawer } from "@layout/mobile-drawer"
import { LayoutSwitcher } from "@layout/layout-switcher"
import type { NavGroup } from "@layout/types"

interface LayoutHeaderProps {
  nav: NavGroup[]
  headerSlot?: ReactNode
  className?: string
  children?: ReactNode
  showLayoutSwitcher?: boolean
  showThemeSwitcher?: boolean
  user?: { name: string; email: string }
  onLogout?: () => void
}

export function LayoutHeader({
  nav,
  headerSlot,
  className,
  children,
  showLayoutSwitcher = false,
  showThemeSwitcher = true,
  user,
  onLogout,
}: LayoutHeaderProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <header className={cn("dr-layout-header", className)}>
      <MobileDrawer nav={nav} />
      {children ?? <SearchCommand navItems={flatNavItems} />}
      <div className="dr-layout-header-end">
        {headerSlot}
        {showLayoutSwitcher && <LayoutSwitcher />}
        {showThemeSwitcher && <ThemeSwitcher />}
        <NotificationBell />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}
