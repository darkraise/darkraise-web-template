import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { cn } from "@/core/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import type { NavGroup, NavItem } from "./types"

interface SidebarNavProps {
  nav: NavGroup[]
  collapsed?: boolean
}

function SidebarNav({ nav, collapsed = false }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {nav.map((group, gi) => (
        <SidebarGroup
          key={gi}
          group={group}
          collapsed={collapsed}
          className={gi > 0 ? "mt-4" : undefined}
        />
      ))}
    </nav>
  )
}

interface SidebarGroupProps {
  group: NavGroup
  collapsed?: boolean
  className?: string
}

function SidebarGroup({
  group,
  collapsed = false,
  className,
}: SidebarGroupProps) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {group.label && !collapsed && (
        <p
          className="px-3 py-1 text-xs font-medium tracking-wider uppercase"
          style={{ color: "hsl(var(--sidebar-foreground-muted))" }}
        >
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <SidebarItem key={item.href} item={item} collapsed={collapsed} />
      ))}
    </div>
  )
}

interface SidebarItemProps {
  item: NavItem
  collapsed?: boolean
  depth?: number
}

function SidebarItem({ item, collapsed = false, depth = 0 }: SidebarItemProps) {
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
        "sidebar-nav-item flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
        collapsed && "justify-center px-0",
        depth > 0 && "py-1.5 text-[13px]",
      )}
      style={depth > 0 ? { paddingLeft: `${depth * 12 + 12}px` } : undefined}
      activeOptions={{ exact: true }}
      activeProps={{ className: "active" }}
    >
      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
      {!collapsed && <span>{item.label}</span>}
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="sidebar-nav-item flex w-full cursor-pointer items-center justify-center rounded-md px-0 py-2 transition-colors duration-150"
        >
          {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
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
            activeProps={{ className: "bg-accent text-accent-foreground" }}
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
          "sidebar-nav-item flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
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
      <CollapsibleContent>
        <div className="space-y-0.5">
          {item.children?.map((child) => (
            <SidebarItem key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { SidebarNav, SidebarGroup, SidebarItem }
