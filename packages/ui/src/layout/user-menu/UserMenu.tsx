import { LayoutTemplate, LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { Avatar, AvatarFallback } from "@components/avatar"
import { Button } from "@components/button"
import { useUiLabels } from "@labels"
import type { LayoutSwitcherProps } from "@layout/layout-switcher"
import { LayoutChoices } from "@layout/layout-switcher/LayoutChoices"
import { useUiText } from "../../i18n/useUiText"

interface UserMenuProps {
  user?: { name: string; email: string }
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
  /**
   * Adds a Layout submenu with the choices `LayoutSwitcher` shows. It is
   * shown below 48rem only, where `LayoutHeader` hides its switcher to fit
   * a phone-width bar.
   */
  layoutSwitcher?: Pick<
    LayoutSwitcherProps,
    "variants" | "shellStylePinned" | "currentShellStyle"
  >
}

export function UserMenu({
  user,
  onProfile,
  onSettings,
  onLogout,
  layoutSwitcher,
}: UserMenuProps) {
  const labels = useUiLabels()
  const uiText = useUiText()
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
        <Button
          variant="ghost"
          size="icon"
          className="dr-user-menu-trigger"
          aria-label={labels.userMenu.trigger}
        >
          <Avatar className="dr-user-menu-avatar">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="dr-user-menu-content" align="end">
        {user && (
          <>
            <DropdownMenuLabel className="dr-user-menu-label">
              <div className="dr-user-menu-identity">
                <p className="dr-user-menu-name">{user.name}</p>
                <p className="dr-user-menu-email">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator
              className={
                layoutSwitcher && !onProfile && !onSettings && !onLogout
                  ? "dr-user-menu-layout-separator"
                  : undefined
              }
            />
          </>
        )}
        {onProfile && (
          <DropdownMenuItem onClick={onProfile}>
            <User className="dr-user-menu-item-icon" aria-hidden="true" />
            {labels.userMenu.profile}
          </DropdownMenuItem>
        )}
        {onSettings && (
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="dr-user-menu-item-icon" aria-hidden="true" />
            {labels.userMenu.settings}
          </DropdownMenuItem>
        )}
        {layoutSwitcher && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="dr-user-menu-layout">
              <LayoutTemplate
                className="dr-user-menu-item-icon"
                aria-hidden="true"
              />
              {uiText("Layout")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <LayoutChoices {...layoutSwitcher} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {(onProfile || onSettings || layoutSwitcher) && onLogout && (
          <DropdownMenuSeparator
            className={
              !onProfile && !onSettings
                ? "dr-user-menu-layout-separator"
                : undefined
            }
          />
        )}
        {onLogout && (
          <DropdownMenuItem onClick={onLogout}>
            <LogOut className="dr-user-menu-item-icon" aria-hidden="true" />
            {labels.userMenu.logout}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
