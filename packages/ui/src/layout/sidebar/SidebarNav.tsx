import { useState } from "react"
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
import { SidebarProvider, useSidebar } from "./SidebarContext"
import type { NavGroup, NavItem } from "@layout/types"

interface SidebarNavProps {
  nav: NavGroup[]
  /**
   * Optional explicit collapsed state. When provided, overrides any value from
   * a parent `SidebarProvider`. When omitted, the value flows from context.
   */
  collapsed?: boolean
}

function SidebarNav({ nav, collapsed: collapsedProp }: SidebarNavProps) {
  const ctx = useSidebar()
  const collapsed = collapsedProp ?? ctx.collapsed

  const tree = (
    <nav className="dr-sidebar-nav" data-collapsed={collapsed || undefined}>
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
  const { Link } = useRouterAdapter()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="dr-sidebar-nav-item dr-sidebar-nav-popover-trigger"
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
        <p className="dr-sidebar-nav-popover-label">{item.label}</p>
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
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="dr-sidebar-nav-item dr-sidebar-nav-collapsible-trigger"
        style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      >
        {item.icon && <item.icon className="dr-sidebar-nav-icon-svg" />}
        <span>{item.label}</span>
        <ChevronRight
          className="dr-sidebar-nav-collapsible-chevron"
          data-open={open ? "true" : undefined}
        />
      </CollapsibleTrigger>
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
