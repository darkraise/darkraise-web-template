import type { ReactNode } from "react"
import type * as React from "react"
import { cn } from "@lib/utils"
import { ThemeSwitcher } from "@theme"
import { SearchCommand } from "@layout/search-command"
import { UserMenu } from "@layout/user-menu"
import { NotificationBell } from "@layout/notification-bell"
import { MobileDrawer } from "@layout/mobile-drawer"
import { LayoutSwitcher } from "@layout/layout-switcher"
import { flattenNavItems } from "@layout/navTree"
import type { NavGroup } from "@layout/types"
import type { LayoutVariant } from "@layout/layoutStore"
import type { ShellStyle, SidebarSelection } from "@theme"

interface LayoutHeaderProps extends React.HTMLAttributes<HTMLElement> {
  nav: NavGroup[]
  headerSlot?: ReactNode
  notificationSlot?: ReactNode
  /** Forwarded to MobileDrawer so the drawer mirrors the sidebar rails. */
  sidebarHeader?: ReactNode
  sidebarFooter?: ReactNode
  /**
   * Forwarded to MobileDrawer's nav so the drawer's active row matches the
   * rail it stands in for below `md`.
   */
  sidebarSelection?: SidebarSelection
  className?: string
  children?: ReactNode
  showLayoutSwitcher?: boolean
  layoutVariants?: LayoutVariant[]
  /** Forwarded to LayoutSwitcher; true when the layout's `shellStyle` prop is set. */
  shellStylePinned?: boolean
  /** Forwarded to LayoutSwitcher: the style the layout resolved and painted. */
  currentShellStyle?: ShellStyle
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
  notificationSlot,
  sidebarHeader,
  sidebarFooter,
  sidebarSelection,
  className,
  children,
  showLayoutSwitcher = false,
  layoutVariants,
  shellStylePinned = false,
  currentShellStyle,
  showThemeSwitcher = true,
  showSearch = true,
  user,
  onProfile,
  onSettings,
  onLogout,
  ...props
}: LayoutHeaderProps) {
  const flatNavItems = flattenNavItems(nav)

  return (
    <header {...props} className={cn("dr-layout-header", className)}>
      <MobileDrawer
        nav={nav}
        header={sidebarHeader}
        footer={sidebarFooter}
        selection={sidebarSelection}
      />
      {/* `.dr-layout-header-end` is `ml-auto`, so omitting search entirely
          keeps the trailing cluster right-aligned without a spacer. */}
      {children ??
        (showSearch ? <SearchCommand navItems={flatNavItems} /> : null)}
      <div className="dr-layout-header-end">
        {headerSlot}
        {showLayoutSwitcher && (
          <LayoutSwitcher
            variants={layoutVariants}
            shellStylePinned={shellStylePinned}
            currentShellStyle={currentShellStyle}
          />
        )}
        {showThemeSwitcher && <ThemeSwitcher />}
        {notificationSlot === undefined ? (
          <NotificationBell />
        ) : (
          notificationSlot
        )}
        <UserMenu
          user={user}
          onProfile={onProfile}
          onSettings={onSettings}
          onLogout={onLogout}
          layoutSwitcher={
            showLayoutSwitcher
              ? {
                  variants: layoutVariants,
                  shellStylePinned,
                  currentShellStyle,
                }
              : undefined
          }
        />
      </div>
    </header>
  )
}
