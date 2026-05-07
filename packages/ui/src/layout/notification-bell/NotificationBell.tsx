import type { ReactNode } from "react"
import { Bell } from "lucide-react"
import { Button } from "@components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"

interface NotificationBellProps {
  count?: number
  /**
   * Popover content. When omitted, the bell shows a default empty state.
   * Supply your own list, link to a feed, etc.
   */
  children?: ReactNode
  emptyMessage?: string
}

export function NotificationBell({
  count = 0,
  children,
  emptyMessage = "No new notifications",
}: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="dr-notification-bell-trigger"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="dr-notification-bell-badge">
              {count > 9 ? "9+" : count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="dr-notification-bell-content" align="end">
        {children ?? (
          <div className="dr-notification-bell-empty">{emptyMessage}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}
