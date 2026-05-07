import { LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { Avatar, AvatarFallback } from "@components/avatar"
import { Button } from "@components/button"

interface UserMenuProps {
  user?: { name: string; email: string }
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

export function UserMenu({
  user,
  onProfile,
  onSettings,
  onLogout,
}: UserMenuProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="dr-user-menu-trigger">
          <Avatar className="dr-user-menu-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="dr-user-menu-content"
        align="end"
        forceMount
      >
        {user && (
          <>
            <DropdownMenuLabel className="dr-user-menu-label">
              <div className="dr-user-menu-identity">
                <p className="dr-user-menu-name">{user.name}</p>
                <p className="dr-user-menu-email">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {onProfile && (
          <DropdownMenuItem onClick={onProfile}>
            <User className="dr-user-menu-item-icon" />
            Profile
          </DropdownMenuItem>
        )}
        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="dr-user-menu-item-icon" />
            Settings
          </DropdownMenuItem>
        )}
        {(onProfile || onSettings) && onLogout && <DropdownMenuSeparator />}
        {onLogout && (
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="dr-user-menu-item-icon" />
            Log out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
