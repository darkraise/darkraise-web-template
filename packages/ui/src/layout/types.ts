import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import type { LayoutVariant } from "./layoutStore"

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  badge?: string
  children?: NavItem[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface LayoutProps {
  children: ReactNode
  nav: NavGroup[]
  headerSlot?: ReactNode
  /** Omit for the default bell; pass null to hide or a node to replace it. */
  notificationSlot?: ReactNode
  /** Slot above the primary nav, mirrored into the mobile drawer. */
  navHeader?: ReactNode
  /** Slot below the primary nav, mirrored into the mobile drawer. */
  navFooter?: ReactNode
  /** @deprecated Use `navHeader`. Still honoured as an alias. */
  sidebarHeader?: ReactNode
  /** @deprecated Use `navFooter`. Still honoured as an alias. */
  sidebarFooter?: ReactNode
  showLayoutSwitcher?: boolean
  layoutVariants?: LayoutVariant[]
  showThemeSwitcher?: boolean
  /**
   * Show a header toggle for the sidebar's active-item left bar.
   * `SidebarLayout` only; the other layouts have no sidebar to drive.
   *
   * @default false
   */
  showActiveBarToggle?: boolean
  user?: { name: string; email: string }
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

export interface BreadcrumbNavItem {
  label: string
  href?: string
}

export interface TabItem {
  label: string
  value: string
  href: string
}

export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbNavItem[]
  title: string
  description?: string
  actions?: ReactNode
  tabs?: TabItem[]
}
