import { createRoot } from "react-dom/client"
import { ChevronRight, House, Package } from "lucide-react"
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
import { SidebarNav, SidebarProvider } from "darkraise-ui/layout"
import {
  RouterAdapterProvider,
  type RouterAdapter,
  type RouterLinkProps,
} from "darkraise-ui/router"
import { ThemeProvider } from "darkraise-ui/theme"
import {
  Steps,
  StepsItem,
  StepsList,
  StepsTitle,
  StepsTrigger,
} from "darkraise-ui/components/steps"
import {
  TreeView,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
import { JsonTreeView } from "darkraise-ui/components/json-tree-view"
import "../../src/styles/globals.css"

function SidebarLink({
  to,
  className,
  style,
  children,
  "aria-current": ariaCurrent,
}: RouterLinkProps) {
  return (
    <a href={to} className={className} style={style} aria-current={ariaCurrent}>
      {children}
    </a>
  )
}

const SIDEBAR_ADAPTER: RouterAdapter = {
  Link: SidebarLink,
  useNavigate: () => () => {},
  usePathname: () => "/",
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const SIDEBAR_NAV = [
  {
    label: "Main",
    items: [
      { label: "Home", href: "/", icon: House },
      {
        label: "Products",
        href: "/products",
        icon: Package,
        children: [{ label: "Drafts", href: "/products/drafts" }],
      },
    ],
  },
]

const FOLDERS: TreeNode = {
  id: "root",
  name: "Files",
  children: [
    { id: "open", name: "Open", children: [{ id: "a", name: "a.txt" }] },
    { id: "closed", name: "Closed", children: [{ id: "b", name: "b.txt" }] },
  ],
}

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
      <div data-probe="sidebar-rail" style={{ width: 64 }}>
        <RouterAdapterProvider value={SIDEBAR_ADAPTER}>
          <SidebarProvider collapsed>
            <SidebarNav nav={SIDEBAR_NAV} selection="pill" />
          </SidebarProvider>
        </RouterAdapterProvider>
      </div>
      <div data-probe="sidebar-tree" style={{ width: 240 }}>
        <RouterAdapterProvider value={SIDEBAR_ADAPTER}>
          <SidebarProvider collapsed={false}>
            <SidebarNav nav={SIDEBAR_NAV} />
          </SidebarProvider>
        </RouterAdapterProvider>
      </div>
      <div data-probe="steps" style={{ width: 360 }}>
        <Steps count={3}>
          <StepsList>
            {["Account", "Profile", "Done"].map((title, index) => (
              <StepsItem key={title} index={index}>
                <StepsTrigger>
                  <StepsTitle>{title}</StepsTitle>
                </StepsTrigger>
              </StepsItem>
            ))}
          </StepsList>
        </Steps>
      </div>
      <div data-probe="tree-chevrons" style={{ width: 240 }}>
        <TreeView data={FOLDERS} defaultExpanded={["open"]}>
          <TreeViewTree>
            {FOLDERS.children?.map((node) => (
              <TreeViewNode key={node.id} node={node} />
            ))}
          </TreeViewTree>
        </TreeView>
        <JsonTreeView data={{ open: { a: 1 }, closed: { b: 2 } }} />
      </div>
    </div>
  </ThemeProvider>,
)
