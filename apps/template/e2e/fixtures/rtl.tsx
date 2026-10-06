import type { CSSProperties, ReactNode } from "react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import { MobileDrawer, SidebarNav, SidebarProvider } from "darkraise-ui/layout"
import {
  RouterAdapterProvider,
  useOptionalRouterAdapter,
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
import { Slider } from "darkraise-ui/components/slider"
import { Progress } from "darkraise-ui/components/progress"
import { BackgroundPage } from "darkraise-ui/components/background-page"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "darkraise-ui/components/carousel"
import {
  VirtualizedTimeline,
  type TimelineBucket,
} from "darkraise-ui/components/virtualized-timeline"
import { BadgeAnchor } from "darkraise-ui/components/badge"
import { Button } from "darkraise-ui/components/button"
import { ButtonGroup } from "darkraise-ui/components/button-group"
import { Input } from "darkraise-ui/components/input"
import { Switch } from "darkraise-ui/components/switch"
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

const MONTHS: TimelineBucket<{ id: string }>[] = Array.from(
  { length: 14 },
  (_, month) => {
    const date = new Date(2026, 1 - month, 1)
    const id = `${date.getFullYear()}-${date.getMonth() + 1}`
    return {
      id,
      date,
      count: 6,
      items: Array.from({ length: 6 }, (_, n) => ({ id: `${id}-${n}` })),
    }
  },
)

// Outside any provider this returns the kit's stub adapter, which is all a
// static layout needs.
function ShellRouter({ children }: { children: ReactNode }) {
  return (
    <RouterAdapterProvider value={useOptionalRouterAdapter()}>
      {children}
    </RouterAdapterProvider>
  )
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
      <div data-probe="slider" style={{ width: 240 }}>
        <Slider defaultValue={[30]} aria-label="Volume" />
      </div>
      <div data-probe="progress" style={{ width: 240 }}>
        <Progress value={30} />
      </div>
      {(["mesh", "spotlight"] as const).map((variant) => (
        <div key={variant} data-probe={`background-${variant}`}>
          <BackgroundPage
            variant={variant}
            style={
              { "--dr-bg-mx": 0.2, width: 400, height: 160 } as CSSProperties
            }
          />
        </div>
      ))}
      <div data-probe="resizable" style={{ width: 400, height: 120 }}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="first" defaultSize={50}>
            First
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="second" defaultSize={50}>
            Second
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div data-probe="carousel" style={{ width: 240, marginInline: 64 }}>
        <Carousel>
          <CarouselContent>
            {[1, 2, 3].map((n) => (
              <CarouselItem key={n}>
                <div style={{ height: 80 }}>Slide {n}</div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      {(["end", "start"] as const).map((side) => (
        <div key={side} data-probe={`timeline-${side}`} style={{ width: 560 }}>
          <VirtualizedTimeline
            style={{ height: 280 }}
            buckets={MONTHS}
            minTileWidth={80}
            scrubberSide={side}
            collapsible
            defaultCollapsedIds={[MONTHS[1]?.id ?? ""]}
            renderItem={({ item }) => <span>{item.id}</span>}
          />
        </div>
      ))}
      <div data-probe="mobile-drawer">
        <ShellRouter>
          <MobileDrawer nav={[]} />
        </ShellRouter>
      </div>
      <div data-probe="badge-anchor" style={{ padding: 16 }}>
        <BadgeAnchor content="3">
          <span style={{ display: "block", width: 40, height: 40 }} />
        </BadgeAnchor>
      </div>
      <div data-probe="switch" style={{ display: "flex", gap: 16 }}>
        <Switch aria-label="Unchecked" />
        <Switch aria-label="Checked" defaultChecked />
      </div>
      <div data-probe="button-group">
        <ButtonGroup>
          <Button variant="outline">One</Button>
          <Button variant="outline">Two</Button>
          <Button variant="outline">Three</Button>
        </ButtonGroup>
      </div>
      <div data-probe="input-prefix" style={{ width: 240 }}>
        <Input prefix="https://" aria-label="Site" />
      </div>
      <div data-probe="tabs-enclosed" style={{ width: 360 }}>
        <Tabs defaultValue="two" orientation="vertical" variant="enclosed">
          <TabsList style={{ width: 120 }}>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
            <TabsTrigger value="three">Three</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel</TabsContent>
          <TabsContent value="two">Second panel</TabsContent>
          <TabsContent value="three">Third panel</TabsContent>
        </Tabs>
      </div>
    </div>
  </ThemeProvider>,
)
