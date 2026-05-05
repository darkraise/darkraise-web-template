import { useState } from "react"
import { useRouterAdapter } from "../../router"
import { ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/tooltip"
import { SidebarProvider, useSidebar } from "./SidebarContext"
import type { NavGroup, NavItem } from "../types"

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

  return (
    <SidebarProvider collapsed={collapsed}>
      <nav
        className="flex flex-col gap-1 px-2"
        data-collapsed={collapsed || undefined}
      >
        {nav.map((group, gi) => (
          <SidebarGroup
            key={gi}
            group={group}
            className={gi > 0 ? "mt-4" : undefined}
          />
        ))}
      </nav>
    </SidebarProvider>
  )
}

interface SidebarGroupProps {
  group: NavGroup
  className?: string
}

function SidebarGroup({ group, className }: SidebarGroupProps) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {group.label && (
        <p
          className={cn(
            "truncate px-3 py-1 text-xs font-medium tracking-wider uppercase",
            collapsed && "invisible",
          )}
          style={{ color: "hsl(var(--sidebar-foreground-muted))" }}
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
      className={cn(
        "sidebar-nav-item flex min-h-[var(--density-cell)] items-center gap-3 rounded-md p-[var(--density-row-py)] text-sm transition-colors duration-150",
        collapsed ? "mx-auto w-[var(--density-cell)] justify-center" : "w-full",
        depth > 0 && "py-1.5 text-[13px]",
      )}
      style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      activeExact
      activeClassName="active"
    >
      {item.icon && (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          <item.icon className="h-4 w-4 shrink-0" />
        </span>
      )}
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="bg-primary/20 text-primary ml-auto rounded-full px-2 py-0.5 text-xs">
          {item.badge}
        </span>
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
          className="sidebar-nav-item mx-auto flex min-h-[var(--density-cell)] w-[var(--density-cell)] cursor-pointer items-center justify-center gap-3 rounded-md p-[var(--density-row-py)] transition-colors duration-150"
        >
          {item.icon && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              <item.icon className="h-4 w-4 shrink-0" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-48 p-1"
        sideOffset={8}
      >
        <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
          {item.label}
        </p>
        {item.children?.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            className="hover:bg-accent hover:text-accent-foreground flex items-center rounded-md px-2 py-1.5 text-sm transition-colors"
            activeClassName="bg-accent text-accent-foreground"
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
        className={cn(
          "sidebar-nav-item flex min-h-[var(--density-cell)] w-full cursor-pointer items-center gap-3 rounded-md p-[var(--density-row-py)] text-sm transition-colors duration-150",
        )}
        style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      >
        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
        <span>{item.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-90",
          )}
          style={{ color: "hsl(var(--sidebar-foreground-muted))" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapsible-up_150ms_ease-out] data-[state=open]:animate-[collapsible-down_150ms_ease-out]">
        <div className="flex flex-col gap-0.5">
          {item.children?.map((child) => (
            <SidebarItem key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { SidebarNav, SidebarGroup, SidebarItem }
