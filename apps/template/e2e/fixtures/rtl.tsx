import { createRoot } from "react-dom/client"
import { ChevronRight } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "darkraise-ui/components/context-menu"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "darkraise-ui/components/dropdown-menu"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "darkraise-ui/components/menubar"
import { ScrollArea, ScrollBar } from "darkraise-ui/components/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "darkraise-ui/components/tabs"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="rtl"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Right to left</p>
      <div data-probe="icon-inline">
        <ChevronRight className="dr-icon-inline size-4" />
      </div>
      <div data-probe="tabs" style={{ width: 240 }}>
        <Tabs defaultValue="t1" variant="enclosed">
          <TabsList>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <TabsTrigger key={n} value={`t${n}`}>
                Tab {n}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div data-probe="scroll-area">
        <ScrollArea type="always" style={{ width: 200, height: 120 }}>
          <div style={{ width: 600, height: 400 }}>Scrolled content</div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div data-probe="dropdown-submenu" style={{ width: 320 }}>
        <DropdownMenu>
          <DropdownMenuTrigger>Dropdown</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Nested</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div data-probe="context-submenu" style={{ width: 320 }}>
        <ContextMenu>
          <ContextMenuTrigger
            style={{ display: "block", padding: 16, border: "1px dashed" }}
          >
            Context area
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Nested</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <div data-probe="menubar-submenu" style={{ width: 320 }}>
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>More</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Nested</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
      <div data-probe="menu-indicator">
        <DropdownMenu>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>
              Show grid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </ThemeProvider>,
)
