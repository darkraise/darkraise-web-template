import { createRoot } from "react-dom/client"
import { Button } from "darkraise-ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "darkraise-ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "darkraise-ui/components/dropdown-menu"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

// One overlay per page: two open overlays fight over focus and dismissal.
const show = new URLSearchParams(location.search).get("show")

function Overlay() {
  if (show === "dialog") {
    return (
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="outline">Edit profile</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Changes are saved when you press Save.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: "grid", gap: 8 }}>
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Ada Lovelace" />
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  if (show === "menu") {
    return (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Account</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem disabled>Team</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div style={{ display: "grid", gap: 8 }}>
          <Label htmlFor="width">Width</Label>
          <Input id="width" defaultValue="100%" />
        </div>
      </PopoverContent>
    </Popover>
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div style={{ padding: 48, minHeight: "100vh" }}>
      <Overlay />
    </div>
  </ThemeProvider>,
)
