import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/core/lib/utils"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { SidebarItem } from "./sidebar-nav"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import { LayoutHeader } from "./layout-header"
import type { LayoutProps } from "./types"

export function StackedLayout({ children, nav, headerSlot }: LayoutProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => currentPath.startsWith(item.href)),
  )
  const activeGroup = nav[activeGroupIndex >= 0 ? activeGroupIndex : 0]

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        {/* Icon sidebar */}
        <aside className="border-border-default bg-surface-sidebar hidden w-16 flex-col items-center border-r py-4 md:flex">
          <div className="bg-primary mb-6 h-8 w-8 rounded-md" />
          <nav className="flex flex-1 flex-col items-center gap-2">
            {nav.map((group, gi) => {
              const firstItem = group.items[0]
              if (!firstItem) return null
              const Icon = firstItem.icon
              const isActive = gi === activeGroupIndex

              return (
                <Tooltip key={gi}>
                  <TooltipTrigger asChild>
                    <Link
                      to={firstItem.href}
                      className={cn(
                        "sidebar-nav-item flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150",
                        isActive && "active",
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {group.label || firstItem.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </aside>

        {/* Sub-nav panel */}
        {activeGroup && (
          <aside className="border-border bg-background hidden w-56 flex-col border-r md:flex">
            {activeGroup.label && (
              <div className="border-border border-b px-4 py-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {activeGroup.label}
                </p>
              </div>
            )}
            <ScrollArea className="flex-1 py-2">
              <nav className="flex flex-col gap-0.5 px-2">
                {activeGroup.items.map((item) => (
                  <SidebarItem key={item.href} item={item} />
                ))}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <LayoutHeader nav={nav} headerSlot={headerSlot} />

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
