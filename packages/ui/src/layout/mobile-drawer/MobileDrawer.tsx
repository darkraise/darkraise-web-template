import { Menu } from "lucide-react"
import { Button } from "@components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/sheet"
import { SidebarNav, SidebarProvider } from "@layout/sidebar"
import type { NavGroup } from "@layout/types"

interface MobileDrawerProps {
  nav: NavGroup[]
}

export function MobileDrawer({ nav }: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="dr-mobile-drawer-trigger"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="dr-mobile-drawer-content">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="dr-mobile-drawer-body">
          {/* MobileDrawer always renders the nav fully expanded, so wrap in
              its own SidebarProvider rather than relying on a parent layout. */}
          <SidebarProvider collapsed={false}>
            <SidebarNav nav={nav} />
          </SidebarProvider>
        </div>
      </SheetContent>
    </Sheet>
  )
}
