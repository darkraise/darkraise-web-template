import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/core/lib/utils"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import { ThemeSwitcher } from "@/core/theme"
import { SearchCommand } from "./search-command"
import { UserMenu } from "./user-menu"
import { NotificationBell } from "./notification-bell"
import { MobileDrawer } from "./mobile-drawer"
import type { LayoutProps } from "./types"

export function StackedLayout({ children, nav, headerSlot }: LayoutProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const activeGroupIndex = nav.findIndex((group) =>
    group.items.some((item) => currentPath.startsWith(item.href)),
  )
  const activeGroup = nav[activeGroupIndex >= 0 ? activeGroupIndex : 0]

  const flatNavItems = nav.flatMap((g) =>
    g.items.map((i) => ({ label: i.label, href: i.href })),
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden">
        {/* Icon sidebar */}
        <aside className="hidden w-16 flex-col items-center border-r border-border-default bg-surface-sidebar py-4 md:flex">
          <div className="mb-6 h-8 w-8 rounded-md bg-primary" />
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
                        "flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors duration-150 hover:bg-white/10 hover:text-white",
                        isActive && "bg-white/10 text-white",
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
          <aside className="hidden w-56 flex-col border-r border-border bg-background md:flex">
            {activeGroup.label && (
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {activeGroup.label}
                </p>
              </div>
            )}
            <ScrollArea className="flex-1 py-2">
              <nav className="flex flex-col gap-0.5 px-2">
                {activeGroup.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                    activeProps={{ className: "active" }}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </ScrollArea>
          </aside>
        )}

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-2 border-b border-border bg-surface-header px-4">
            <MobileDrawer nav={nav} />
            <SearchCommand navItems={flatNavItems} />
            <div className="ml-auto flex items-center gap-1">
              {headerSlot}
              <ThemeSwitcher />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
