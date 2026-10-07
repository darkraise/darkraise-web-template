import { createRoot } from "react-dom/client"
import { Button } from "darkraise-ui/components/button"
import { Calendar } from "darkraise-ui/components/calendar"
import {
  ColorPicker,
  ColorPickerSwatch,
} from "darkraise-ui/components/color-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "darkraise-ui/components/dropdown-menu"
import { Highlight } from "darkraise-ui/components/highlight"
import { DateInput } from "darkraise-ui/components/date-input"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "darkraise-ui/components/menubar"
import {
  NumberInput,
  NumberInputControl,
  NumberInputField,
} from "darkraise-ui/components/number-input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "darkraise-ui/components/pagination"
import { Progress } from "darkraise-ui/components/progress"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import { ScrollArea } from "darkraise-ui/components/scroll-area"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
import { Separator } from "darkraise-ui/components/separator"
import { Skeleton } from "darkraise-ui/components/skeleton"
import { Slider } from "darkraise-ui/components/slider"
import { Spinner } from "darkraise-ui/components/spinner"
import {
  Steps,
  StepsIndicator,
  StepsItem,
  StepsList,
  StepsSeparator,
  StepsTitle,
  StepsTrigger,
} from "darkraise-ui/components/steps"
import { Switch } from "darkraise-ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsVariant,
} from "darkraise-ui/components/tabs"
import { Toggle } from "darkraise-ui/components/toggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "darkraise-ui/components/toggle-group"
import {
  VirtualizedTimeline,
  type TimelineBucket,
} from "darkraise-ui/components/virtualized-timeline"
import {
  TreeView,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
import { SidebarNav, SidebarProvider, type NavGroup } from "darkraise-ui/layout"
import {
  RouterAdapterProvider,
  type RouterAdapter,
  type RouterLinkProps,
} from "darkraise-ui/router"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const TAB_VARIANTS: TabsVariant[] = [
  "default",
  "outline",
  "underline",
  "enclosed",
]

const FILES: TreeNode = {
  id: "root",
  name: "Files",
  children: [
    { id: "todo", name: "todo.txt" },
    { id: "notes", name: "notes.txt" },
  ],
}

const NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/", badge: "3" },
      { label: "Settings", href: "/settings" },
    ],
  },
]

// The adapter applies the active class itself, as a router would, so
// "Dashboard" (the current path) is the current row and "Settings" is idle.
const PATHNAME = "/"
const ADAPTER: RouterAdapter = {
  Link: ({
    to,
    className,
    activeClassName,
    style,
    children,
  }: RouterLinkProps) => (
    <a
      href={to}
      className={
        to === PATHNAME
          ? [className, activeClassName].filter(Boolean).join(" ")
          : className
      }
      aria-current={to === PATHNAME ? "page" : undefined}
      style={style}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </a>
  ),
  useNavigate: () => () => {},
  usePathname: () => PATHNAME,
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const SHOTS: TimelineBucket<{ id: string }>[] = [
  {
    id: "2026-01",
    date: new Date(2026, 0, 1),
    count: 2,
    items: [{ id: "first" }, { id: "second" }],
  },
]

// An opaque tile, as a photo would be; content colours are not forced.
function Shot() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#808080",
        forcedColorAdjust: "none",
      }}
    />
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="forced-colors"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Forced colours</p>
      <div
        data-probe="ref-highlight"
        style={{ width: 24, height: 24, backgroundColor: "Highlight" }}
      />
      <div
        data-probe="ref-canvas"
        style={{ width: 24, height: 24, backgroundColor: "Canvas" }}
      />
      {TAB_VARIANTS.map((variant) => (
        <div
          key={variant}
          data-probe={`tabs-${variant}`}
          style={{ width: 240 }}
        >
          <Tabs defaultValue="one" variant={variant}>
            <TabsList>
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
            <TabsContent value="one">Panel</TabsContent>
          </Tabs>
        </div>
      ))}
      <div data-probe="segment-group">
        <SegmentGroup defaultValue="day" aria-label="Range">
          <SegmentGroupIndicator />
          <SegmentGroupItem value="day">Day</SegmentGroupItem>
          <SegmentGroupItem value="week">Week</SegmentGroupItem>
        </SegmentGroup>
      </div>
      {(["filled", "outline"] as const).map((variant) => (
        <div
          key={variant}
          data-probe={`listbox-${variant}`}
          style={{ width: 160 }}
        >
          <Listbox variant={variant} defaultValue="cherry" aria-label="Fruit">
            <ListboxItem value="cherry">Cherry</ListboxItem>
            <ListboxItem value="apple">Apple</ListboxItem>
          </Listbox>
        </div>
      ))}
      {(["filled", "outline"] as const).map((variant) => (
        <div
          key={variant}
          data-probe={`tree-${variant}`}
          style={{ width: 160 }}
        >
          <TreeView
            data={FILES}
            variant={variant}
            defaultSelected={["todo"]}
            selectionMode="single"
          >
            <TreeViewTree>
              {FILES.children?.map((node) => (
                <TreeViewNode key={node.id} node={node} />
              ))}
            </TreeViewTree>
          </TreeView>
        </div>
      ))}
      <div data-probe="toggle" style={{ display: "flex", gap: 8 }}>
        <Toggle defaultPressed>Bold</Toggle>
        <Toggle>Italic</Toggle>
      </div>
      <div data-probe="toggle-group">
        <ToggleGroup type="single" defaultValue="left" aria-label="Align">
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div data-probe="pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#10" isActive>
                10
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#11">11</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div data-probe="switch" style={{ display: "flex", gap: 8 }}>
        <Switch defaultChecked aria-label="On" />
        <Switch aria-label="Off" />
      </div>
      <div data-probe="calendar">
        <Calendar
          mode="single"
          selected={new Date(2026, 0, 14)}
          defaultMonth={new Date(2026, 0, 1)}
        />
      </div>
      <div data-probe="menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Edit
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div data-probe="submenu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>More</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Copy</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Link</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div data-probe="menubar">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
      <div data-probe="sidebar" style={{ width: 240 }}>
        <RouterAdapterProvider value={ADAPTER}>
          <SidebarProvider collapsed={false}>
            <SidebarNav nav={NAV} />
          </SidebarProvider>
        </RouterAdapterProvider>
      </div>
      <div data-probe="number-input" style={{ width: 160 }}>
        <NumberInput defaultValue={1}>
          <NumberInputControl>
            <NumberInputField aria-label="Quantity" aria-invalid="true" />
          </NumberInputControl>
        </NumberInput>
      </div>
      <div data-probe="date-input">
        <DateInput aria-label="Start date" aria-invalid="true" />
      </div>
      <div data-probe="timeline">
        <VirtualizedTimeline
          buckets={SHOTS}
          selectable
          defaultSelectedIds={["first"]}
          renderItem={() => <Shot />}
          style={{ width: 320, height: 200 }}
        />
      </div>
      <div
        data-probe="ref-highlight-on-text"
        style={{ padding: 4, backgroundColor: "CanvasText" }}
      >
        <div style={{ width: 16, height: 16, backgroundColor: "Highlight" }} />
      </div>
      <div data-probe="separator" style={{ width: 120 }}>
        <Separator />
      </div>
      <div data-probe="slider" style={{ width: 160 }}>
        <Slider defaultValue={[50]} aria-label="Volume" />
      </div>
      <div data-probe="progress" style={{ width: 160 }}>
        <Progress value={50} aria-label="Upload" />
      </div>
      <div data-probe="scroll-area">
        <ScrollArea style={{ width: 120, height: 60 }}>
          <div style={{ height: 240 }}>Scrolling content</div>
        </ScrollArea>
      </div>
      {/* Panels that fill the group squeeze the 1px handle to nothing;
          narrower panels leave it its width. */}
      <div data-probe="resizable" style={{ width: 160, height: 60 }}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={50} style={{ width: "49%" }}>
            Left
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} style={{ width: "49%" }}>
            Right
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div data-probe="steps" style={{ width: 360 }}>
        <Steps count={3} defaultStep={1}>
          <StepsList>
            {["Account", "Profile", "Confirm"].map((title, index) => (
              <StepsItem key={title} index={index}>
                <StepsTrigger>
                  <StepsIndicator>{index + 1}</StepsIndicator>
                  <StepsTitle>{title}</StepsTitle>
                </StepsTrigger>
                {index < 2 ? <StepsSeparator /> : null}
              </StepsItem>
            ))}
          </StepsList>
        </Steps>
      </div>
      <div data-probe="skeleton">
        <Skeleton style={{ width: 40, height: 16 }} />
      </div>
      <div data-probe="spinner">
        <Spinner size="lg" />
      </div>
      <div
        data-probe="ref-mark"
        style={{ width: 24, height: 24, backgroundColor: "Mark" }}
      />
      <div
        data-probe="ref-highlight-text"
        style={{
          width: 24,
          height: 24,
          backgroundColor: "HighlightText",
          forcedColorAdjust: "none",
        }}
      />
      <div data-probe="color-picker">
        <ColorPicker defaultValue="#ff0000">
          <ColorPickerSwatch />
        </ColorPicker>
      </div>
      <p data-probe="highlight" style={{ margin: 0 }}>
        <Highlight text="Find the match" query="match" />
      </p>
    </div>
  </ThemeProvider>,
)
