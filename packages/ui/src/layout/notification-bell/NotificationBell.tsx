import { Bell } from "lucide-react"
import { Button } from "../../components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/popover"

interface NotificationBellProps {
  count?: number
}

export function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
              {count > 9 ? "9+" : count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="text-muted-foreground py-6 text-center text-sm">
          No new notifications
        </div>
      </PopoverContent>
    </Popover>
  )
}
