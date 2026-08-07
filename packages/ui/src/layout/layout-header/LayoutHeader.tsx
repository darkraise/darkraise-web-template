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
  /** Forwarded to MobileDrawer so the drawer mirrors the sidebar rails. */
  sidebarHeader?: ReactNode
  sidebarFooter?: ReactNode
  className?: string
  children?: ReactNode
  showLayoutSwitcher?: boolean
  showThemeSwitcher?: boolean
  /**
   * Render the search trigger in the header. `SidebarLayout` sets this to
   * `false` because it hosts search at the top of its rail instead; the
   * layouts without a rail keep it here.
   *
   * @default true
   */
  showSearch?: boolean
  user?: { name: string; email: string }
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

export function LayoutHeader({
  nav,
  headerSlot,
  sidebarHeader,
  sidebarFooter,
  className,
  children,
  showLayoutSwitcher = false,
  showThemeSwitcher = true,
  showSearch = true,
  user,
  onProfile,
  onSettings,
  onLogout,
}: LayoutHeaderProps) {
  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <header className={cn("dr-layout-header", className)}>
      <MobileDrawer nav={nav} header={sidebarHeader} footer={sidebarFooter} />
      {/* `.dr-layout-header-end` is `ml-auto`, so omitting search entirely
          keeps the trailing cluster right-aligned without a spacer. */}
      {children ??
        (showSearch ? <SearchCommand navItems={flatNavItems} /> : null)}
      <div className="dr-layout-header-end">
        {headerSlot}
        {showLayoutSwitcher && <LayoutSwitcher />}
        {showThemeSwitcher && <ThemeSwitcher />}
        <NotificationBell />
        <UserMenu
          user={user}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}
