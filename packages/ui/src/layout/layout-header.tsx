import type { ReactNode } from "react"
import { cn } from "../lib/utils"
import { ThemeSwitcher } from "../theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import { LayoutSwitcher } from "./layout-switcher"
import type { NavGroup } from "./types"

interface LayoutHeaderProps {
  nav: NavGroup[]
  headerSlot?: ReactNode
  className?: string
  children?: ReactNode
}

export function LayoutHeader({
  nav,
  headerSlot,
  className,
  children,
}: LayoutHeaderProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <header
      className={cn(
        "border-border bg-surface-header flex h-14 items-center gap-2 border-b px-4",
        className,
      )}
    >
      <MobileDrawer nav={nav} />
      {children ?? <SearchCommand navItems={flatNavItems} />}
      <div className="ml-auto flex items-center gap-1">
        {headerSlot}
        <LayoutSwitcher />
        <ThemeSwitcher />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
