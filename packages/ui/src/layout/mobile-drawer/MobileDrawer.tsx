import type { ReactNode } from "react"
import { Menu } from "lucide-react"
import { Button } from "@components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/sheet"
import { SidebarNav, SidebarProvider } from "@layout/sidebar"
import type { SidebarActiveBar } from "@layout/sidebar"
import type { NavGroup } from "@layout/types"

interface MobileDrawerProps {
  nav: NavGroup[]
  /** Mirrors SidebarLayout's `sidebarHeader`, rendered above the nav. */
  header?: ReactNode
  /**
   * Mirrors SidebarLayout's `sidebarFooter`, pinned to the bottom of the
   * drawer. The `aside` it stands in for is `display: none` below `md`, so
   * anything living only in the sidebar footer (account menu, log out) is
   * unreachable on small screens unless the drawer carries it too.
   */
  footer?: ReactNode
  /** Extra content rendered after the nav, inside the scrolling body. */
  children?: ReactNode
  /** Accessible title of the drawer. */
  title?: string
  /** Accessible label of the trigger button. */
  triggerLabel?: string
  /**
   * Active-item indicator for the nav, matching `SidebarLayout`'s own. The
   * drawer stands in for the rail below `md`, so leaving it unset would show
   * the preset default there while the rail shows something else.
   */
  activeBar?: boolean | SidebarActiveBar
}

export function MobileDrawer({
  nav,
  header,
  footer,
  children,
  title = "Navigation",
  triggerLabel = "Open menu",
  activeBar,
}: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="dr-mobile-drawer-trigger"
        >
          <Menu className="size-[var(--icon-size-lg)]" aria-hidden="true" />
          <span className="sr-only">{triggerLabel}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="dr-mobile-drawer-content">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {/* MobileDrawer always renders the nav fully expanded, so wrap in
            its own SidebarProvider rather than relying on a parent layout. */}
        <SidebarProvider collapsed={false}>
          {header && <div className="dr-mobile-drawer-section">{header}</div>}
          <div className="dr-mobile-drawer-body">
            <SidebarNav nav={nav} activeBar={activeBar} />
            {children}
          </div>
          {footer && (
            <div className="dr-mobile-drawer-section" data-position="footer">
              {footer}
            </div>
          )}
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  )
}
