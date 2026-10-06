import { createRoot } from "react-dom/client"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "darkraise-ui/components/pagination"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
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
  TreeView,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
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
              <PaginationLink href="#1" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#2">2</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div data-probe="switch" style={{ display: "flex", gap: 8 }}>
        <Switch defaultChecked aria-label="On" />
        <Switch aria-label="Off" />
      </div>
    </div>
  </ThemeProvider>,
)
