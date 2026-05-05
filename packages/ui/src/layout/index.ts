export { PageHeader } from "./page-header"
export { SearchCommand } from "./search-command"
export { UserMenu } from "./user-menu"
export { NotificationBell } from "./notification-bell"
export { MobileDrawer } from "./mobile-drawer"
export { BrandLogo } from "./brand-logo"
export { useBrandStore } from "./brand-store"
export { LayoutHeader } from "./layout-header"
export {
  SidebarLayout,
  SidebarNav,
  SidebarGroup,
  SidebarItem,
  SidebarProvider,
  useSidebar,
} from "./sidebar"
export { TopNavLayout } from "./top-nav-layout"
export { StackedLayout } from "./stacked-layout"
export { SplitPanelLayout } from "./split-panel-layout"
export { LayoutSwitcher } from "./layout-switcher"
export { useLayoutStore, type LayoutVariant } from "./layout-store"

// Layout primitives — composable building blocks for in-route layout.
// Use these instead of ad-hoc Tailwind utility soup for vertical/horizontal
// stacking, max-width containers, grids, semantic sections, padded boxes,
// and centering.
export { Stack, type StackProps } from "./stack"
export { Inline, type InlineProps } from "./inline"
export { Container, type ContainerProps } from "./container"
export { Grid, type GridProps } from "./grid"
export { Section, type SectionProps } from "./section"
export { Box, type BoxProps } from "./box"
export { Center, type CenterProps } from "./center"

export type {
  NavItem,
  NavGroup,
  LayoutProps,
  BreadcrumbNavItem,
  TabItem,
  PageHeaderProps,
} from "./types"
