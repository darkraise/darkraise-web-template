import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Bold, Italic, Underline } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import { ButtonGroup } from "darkraise-ui/components/button-group"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
import { Marquee } from "darkraise-ui/components/marquee"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "darkraise-ui/components/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "darkraise-ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import { Toggle } from "darkraise-ui/components/toggle"
import { Toolbar, ToolbarSeparator } from "darkraise-ui/components/toolbar"
import {
  TreeView,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
import { UserMenu } from "darkraise-ui/layout"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const FILES: TreeNode = {
  id: "root",
  name: "Files",
  children: [
    {
      id: "docs",
      name: "Documents",
      children: [{ id: "resume", name: "Resume.pdf" }],
    },
    { id: "todo", name: "todo.txt" },
  ],
}

function Tree({ variant }: { variant: "filled" | "outline" }) {
  return (
    <TreeView
      data={FILES}
      variant={variant}
      defaultExpanded={["docs"]}
      defaultSelected={["todo"]}
      selectionMode="single"
    >
      <TreeViewTree>
        {FILES.children?.map((node) => (
          <TreeViewNode key={node.id} node={node} />
        ))}
      </TreeViewTree>
    </TreeView>
  )
}

// Done closes the popover without onOpenChange, so every count in the log
// comes from the closing layer itself.
function ClosingPopover() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState({ openChangeFalse: 0, interactOutside: 0 })
  const [pressedWhile, setPressedWhile] = useState("none")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clicks, setClicks] = useState({ done: 0, next: 0 })
  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next)
            setLog((l) => ({ ...l, openChangeFalse: l.openChangeFalse + 1 }))
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent
          data-closing-popover=""
          onInteractOutside={() =>
            setLog((l) => ({ ...l, interactOutside: l.interactOutside + 1 }))
          }
        >
          <Button
            onClick={() => {
              setOpen(false)
              setClicks((c) => ({ ...c, done: c.done + 1 }))
            }}
          >
            Done
          </Button>
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        onClick={() => setClicks((c) => ({ ...c, next: c.next + 1 }))}
        onPointerDown={() =>
          setPressedWhile(
            document
              .querySelector<HTMLElement>("[data-closing-popover]")
              ?.getAttribute("data-state") ?? "none",
          )
        }
      >
        Next
      </Button>
      <output data-testid="closing-popover-log">
        {`onOpenChange(false) ${log.openChangeFalse} · onInteractOutside ${log.interactOutside} · pressed while ${pressedWhile}`}
      </output>
      <output data-testid="closing-clicks">
        {`done ${clicks.done} · next ${clicks.next}`}
      </output>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-closing-dialog="">
          <DialogTitle>Closing dialog</DialogTitle>
          <DialogDescription>Its backdrop covers Next.</DialogDescription>
          <Button onClick={() => setDialogOpen(false)}>Close dialog</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="controls-behaviour"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Controls behaviour</p>
      <div data-probe="tree" style={{ width: 240 }}>
        <Tree variant="filled" />
      </div>
      <div data-probe="toolbar-vertical" style={{ width: 320 }}>
        <Toolbar orientation="vertical" aria-label="Formatting">
          <Toggle aria-label="Bold">
            <Bold className="size-4" />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic className="size-4" />
          </Toggle>
          <ToolbarSeparator orientation="horizontal" />
          <Toggle aria-label="Underline">
            <Underline className="size-4" />
          </Toggle>
        </Toolbar>
      </div>
      <div data-probe="listbox-outline" style={{ width: 200 }}>
        <Listbox variant="outline" defaultValue="cherry" aria-label="Fruit">
          <ListboxItem value="apple">Apple</ListboxItem>
          <ListboxItem value="cherry">Cherry</ListboxItem>
        </Listbox>
      </div>
      <div data-probe="tree-outline" style={{ width: 240 }}>
        <Tree variant="outline" />
      </div>
      <div data-probe="pagination-outline">
        <Pagination variant="outline">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#3">3</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div
        data-probe="button-group"
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {(["default", "secondary", "destructive"] as const).map((variant) => (
          <ButtonGroup key={variant} aria-label={variant}>
            <Button variant={variant}>Day</Button>
            <Button variant={variant}>Week</Button>
          </ButtonGroup>
        ))}
      </div>
      <div data-probe="marquee" style={{ width: 320 }}>
        <Marquee>
          <a href="#news">News</a>
        </Marquee>
        <button type="button">After the marquee</button>
      </div>
      <div data-probe="resizable" style={{ width: 200, height: 60 }}>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="start" defaultSize={50}>
            Start
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel id="end" defaultSize={50}>
            End
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div
        data-probe="closing-popover"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, width: 320 }}
      >
        <ClosingPopover />
      </div>
      <div data-probe="user-menu">
        <UserMenu
          onLogout={() => {}}
          layoutSwitcher={{ variants: ["sidebar", "top-nav"] }}
        />
      </div>
    </div>
  </ThemeProvider>,
)
