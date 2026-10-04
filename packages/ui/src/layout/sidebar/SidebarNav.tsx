import { useContext, useEffect, useRef, useState } from "react"
import { useRouterAdapter } from "@router"
import { cn } from "@lib/utils"
import { ChevronRight } from "lucide-react"
import "./sidebar-nav.css"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/tooltip"
import { SidebarProvider } from "./SidebarContext"
import { useSidebar } from "./sidebar-context"
import { containsItem, findActiveItem } from "@layout/navTree"
import { ActiveNavItemContext, useActiveNavItem } from "./active-nav-context"
import { useSidebarSelection, useSidebarShadow } from "@layout/shell"
import { SidebarSelectionContext } from "./sidebar-selection"
import { useNavIndicator } from "./useNavIndicator"
import type { SidebarSelection } from "@theme"
import type { NavGroup, NavItem } from "@layout/types"

interface SidebarNavProps {
  nav: NavGroup[]
  /**
   * Optional explicit collapsed state. When provided, overrides any value from
   * a parent `SidebarProvider`. When omitted, the value flows from context.
   */
  collapsed?: boolean
  /**
   * Look of the active row. Omitted, the theme's `sidebarSelection` setting
   * decides, and its `auto` follows the style.
   */
  selection?: SidebarSelection
}

function SidebarNav({
  nav,
  collapsed: collapsedProp,
  selection,
}: SidebarNavProps) {
  const ctx = useSidebar()
  const collapsed = collapsedProp ?? ctx.collapsed
  const { usePathname } = useRouterAdapter()
  const pathname = usePathname()
  const activeItem = findActiveItem(
    nav.flatMap((group) => group.items),
    pathname,
  )
  const look = useSidebarSelection(selection)
  const shadow = useSidebarShadow()
  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  useNavIndicator(navRef, indicatorRef, pathname, nav)

  const tree = (
    <SidebarSelectionContext.Provider value={look}>
      <ActiveNavItemContext.Provider value={activeItem}>
        <nav
          ref={navRef}
          className="dr-sidebar-nav"
          data-collapsed={collapsed || undefined}
          data-sidebar-selection={look}
          data-sidebar-shadow={shadow}
          data-indicator="pending"
        >
          <span
            ref={indicatorRef}
            className="dr-sidebar-nav-indicator"
            aria-hidden="true"
          />
          {nav.map((group, gi) => (
            <SidebarGroup
              key={gi}
              group={group}
              position={gi > 0 ? "subsequent" : undefined}
            />
          ))}
        </nav>
      </ActiveNavItemContext.Provider>
    </SidebarSelectionContext.Provider>
  )

  // Only wrap in a SidebarProvider when the consumer explicitly overrides
  // `collapsed`; otherwise we'd shadow the parent layout's provider with an
  // identical value and break any future state it might expose.
  if (collapsedProp === undefined) {
    return tree
  }
  return <SidebarProvider collapsed={collapsedProp}>{tree}</SidebarProvider>
}

interface SidebarGroupProps {
  group: NavGroup
  position?: "subsequent"
}

function SidebarGroup({ group, position }: SidebarGroupProps) {
  const { collapsed } = useSidebar()
  return (
    <div className="dr-sidebar-nav-group" data-position={position}>
      {group.label && (
        <p
          className="dr-sidebar-nav-group-label"
          data-collapsed={collapsed ? "true" : undefined}
          aria-hidden={collapsed || undefined}
        >
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
    </div>
  )
}

interface SidebarItemProps {
  item: NavItem
  depth?: number
}

function SidebarItem({ item, depth = 0 }: SidebarItemProps) {
  const { Link } = useRouterAdapter()
  const { collapsed } = useSidebar()
  const hasChildren = item.children && item.children.length > 0
  const current = useActiveNavItem() === item

  if (hasChildren && !collapsed) {
    return <CollapsibleSidebarItem item={item} depth={depth} />
  }

  if (hasChildren && collapsed) {
    return <CollapsedParentItem item={item} />
  }

  const linkContent = (
    <Link
      to={item.href}
      className={cn(
        "dr-sidebar-nav-item dr-sidebar-nav-link",
        current && "dr-sidebar-nav-current",
      )}
      data-collapsed={collapsed ? "true" : undefined}
      data-depth={depth > 0 ? "nested" : undefined}
      style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      // Kept so a router's own (often fuzzy) match never marks a second row;
      // the kit decides which row is current.
      activeExact
      aria-current={current ? "page" : undefined}
    >
      {item.icon && (
        <span className="dr-sidebar-nav-icon">
          <item.icon className="dr-sidebar-nav-icon-svg" />
        </span>
      )}
      {!collapsed && (
        // Truncated by CSS; `title` surfaces the full text on hover. Screen
        // readers are unaffected — the complete string stays in the DOM and
        // only the painting is clipped.
        <span className="dr-sidebar-nav-label" title={item.label}>
          {item.label}
        </span>
      )}
      {!collapsed && item.badge && (
        <span className="dr-sidebar-nav-badge">{item.badge}</span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return linkContent
}

function CollapsedParentItem({ item }: { item: NavItem }) {
  const { Link } = useRouterAdapter()
  const activeItem = useActiveNavItem()
  // Collapsed, one icon stands in for the whole group, so it has to carry the
  // active state on its children's behalf — nothing else on the rail can.
  const active = containsItem(item, activeItem)
  const look = useContext(SidebarSelectionContext)
  const shadow = useSidebarShadow()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "dr-sidebar-nav-item dr-sidebar-nav-popover-trigger",
            active && "dr-sidebar-nav-current",
          )}
          aria-label={item.label}
          data-status={active ? "active" : undefined}
        >
          {item.icon && (
            <span className="dr-sidebar-nav-icon">
              <item.icon className="dr-sidebar-nav-icon-svg" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="dr-sidebar-nav-popover-content"
        data-sidebar-selection={look}
        data-sidebar-shadow={shadow}
        sideOffset={8}
      >
        {/* The parent's own route. Rendered as the first entry rather than a
            static heading: the rail trigger opens the popover instead of
            navigating, so this is the only way to reach the parent while
            collapsed. */}
        <Link
          to={item.href}
          className={cn(
            "dr-sidebar-popover-child dr-sidebar-nav-popover-parent",
            activeItem === item && "dr-sidebar-nav-current",
          )}
          activeExact
          aria-current={activeItem === item ? "page" : undefined}
        >
          {item.label}
        </Link>
        <div className="dr-sidebar-nav-popover-separator" />
        {item.children?.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            // The popover lists one level, so a deeper route marks the child
            // that leads to it.
            className={cn(
              "dr-sidebar-popover-child",
              containsItem(child, activeItem) && "dr-sidebar-nav-current",
            )}
            activeExact
            aria-current={containsItem(child, activeItem) ? "page" : undefined}
          >
            {child.label}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function CollapsibleSidebarItem({
  item,
  depth,
}: {
  item: NavItem
  depth: number
}) {
  const { Link } = useRouterAdapter()
  const activeItem = useActiveNavItem()
  const current = activeItem === item
  const covered = containsItem(item, activeItem)
  const [open, setOpen] = useState(covered)

  // Opens on the way in, but never closes on the way out: navigating into a
  // group should reveal it, while navigating away must not undo a group the
  // user opened by hand.
  useEffect(() => {
    if (covered) setOpen(true)
  }, [covered])

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="dr-sidebar-nav-collapsible"
    >
      {/* The row, not the link, is the item: it owns the hover fill and the
          active indicator so both span the toggle too, exactly as a leaf row
          fills end to end. That puts the active state out of the router's
          reach, so the row takes the kit's own current marker. */}
      <div
        className={cn(
          "dr-sidebar-nav-item dr-sidebar-nav-collapsible-row",
          current
            ? "dr-sidebar-nav-current"
            : covered && "dr-sidebar-nav-ancestor",
        )}
        data-status={current ? "active" : undefined}
      >
        {/* The depth indent sits on the link, not on the row: the link carries
            its own padding, so indenting the row would stack the two and push
            a nested parent past the nested leaves it sits above. */}
        <Link
          to={item.href}
          className="dr-sidebar-nav-link dr-sidebar-nav-collapsible-link"
          data-depth={depth > 0 ? "nested" : undefined}
          style={
            depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined
          }
          activeExact
          aria-current={current ? "page" : undefined}
        >
          {item.icon && (
            <span className="dr-sidebar-nav-icon">
              <item.icon className="dr-sidebar-nav-icon-svg" />
            </span>
          )}
          <span className="dr-sidebar-nav-label" title={item.label}>
            {item.label}
          </span>
          {item.badge && (
            <span className="dr-sidebar-nav-badge">{item.badge}</span>
          )}
        </Link>
        {/* Named for the item alone rather than "Expand X" / "Collapse X":
            `CollapsibleContent` is a region labelled by this trigger, so a
            state-varying name would rename the region on every toggle.
            `aria-expanded` already carries the state. */}
        <CollapsibleTrigger
          className="dr-sidebar-nav-chevron-button"
          aria-label={item.label}
        >
          <ChevronRight
            className="dr-sidebar-nav-collapsible-chevron"
            data-open={open ? "true" : undefined}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="dr-sidebar-nav-collapsible-content">
        <div className="dr-sidebar-nav-collapsible-children">
          {item.children?.map((child) => (
            <SidebarItem key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { SidebarNav, SidebarGroup, SidebarItem }
