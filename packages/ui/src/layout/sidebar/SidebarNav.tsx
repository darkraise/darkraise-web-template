import { useEffect, useState } from "react"
import { useRouterAdapter } from "@router"
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
import { coversPath } from "@layout/navTree"
import { resolveActiveBar } from "./sidebar-active-bar"
import type { SidebarActiveBar } from "./sidebar-active-bar"
import type { NavGroup, NavItem } from "@layout/types"

interface SidebarNavProps {
  nav: NavGroup[]
  /**
   * Optional explicit collapsed state. When provided, overrides any value from
   * a parent `SidebarProvider`. When omitted, the value flows from context.
   */
  collapsed?: boolean
  /**
   * Indicator style for the active item.
   *
   * - omitted: whatever the active preset renders today. Glass shows a ring
   *   and a rail; Sci-fi shows a ring; everything else shows a rail.
   * - `"bar"` / `true`: 3px left rail only.
   * - `"ring"` / `false`: uniform 1px ring only.
   * - `"both"`: 1px ring plus the 3px rail.
   *
   * Omitting the prop is NOT the same as passing `"bar"` — omitting leaves
   * each preset's own look alone, while `"bar"` forces a rail everywhere.
   */
  activeBar?: boolean | SidebarActiveBar
}

function SidebarNav({
  nav,
  collapsed: collapsedProp,
  activeBar,
}: SidebarNavProps) {
  const ctx = useSidebar()
  const collapsed = collapsedProp ?? ctx.collapsed

  const tree = (
    <nav
      className="dr-sidebar-nav"
      data-collapsed={collapsed || undefined}
      data-active-bar={resolveActiveBar(activeBar)}
    >
      {nav.map((group, gi) => (
        <SidebarGroup
          key={gi}
          group={group}
          position={gi > 0 ? "subsequent" : undefined}
        />
      ))}
    </nav>
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

  if (hasChildren && !collapsed) {
    return <CollapsibleSidebarItem item={item} depth={depth} />
  }

  if (hasChildren && collapsed) {
    return <CollapsedParentItem item={item} />
  }

  const linkContent = (
    <Link
      to={item.href}
      className="dr-sidebar-nav-item dr-sidebar-nav-link"
      data-collapsed={collapsed ? "true" : undefined}
      data-depth={depth > 0 ? "nested" : undefined}
      style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      activeExact
      activeClassName="active"
    >
      {item.icon && (
        <span className="dr-sidebar-nav-icon">
          <item.icon className="dr-sidebar-nav-icon-svg" />
        </span>
      )}
      {!collapsed && <span className="dr-sidebar-nav-label">{item.label}</span>}
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
  const { Link, usePathname } = useRouterAdapter()
  // Collapsed, one icon stands in for the whole group, so it has to carry the
  // active state on its children's behalf — nothing else on the rail can.
  const active = coversPath(item, usePathname())
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="dr-sidebar-nav-item dr-sidebar-nav-popover-trigger"
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
        sideOffset={8}
      >
        {/* The parent's own route. Rendered as the first entry rather than a
            static heading: the rail trigger opens the popover instead of
            navigating, so this is the only way to reach the parent while
            collapsed. */}
        <Link
          to={item.href}
          className="dr-sidebar-popover-child dr-sidebar-nav-popover-parent"
          activeExact
          activeClassName="active"
        >
          {item.label}
        </Link>
        <div className="dr-sidebar-nav-popover-separator" />
        {item.children?.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            className="dr-sidebar-popover-child"
            activeClassName="active"
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
  const { Link, usePathname } = useRouterAdapter()
  const currentPath = usePathname()
  const covered = coversPath(item, currentPath)
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
          reach — `activeClassName` lands on the anchor — so it is resolved
          here instead, matching the `activeExact` the leaf branch asks for. */}
      <div
        className="dr-sidebar-nav-item dr-sidebar-nav-collapsible-row"
        data-status={currentPath === item.href ? "active" : undefined}
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
        >
          {item.icon && (
            <span className="dr-sidebar-nav-icon">
              <item.icon className="dr-sidebar-nav-icon-svg" />
            </span>
          )}
          <span className="dr-sidebar-nav-label">{item.label}</span>
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
