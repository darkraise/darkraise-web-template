import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  AppWindow,
  ArrowUpDown,
  ClipboardPaste,
  Copy,
  Eye,
  FilePlus,
  FileText,
  FolderPlus,
  Globe,
  Laptop,
  Link,
  Link2,
  Mail,
  Pencil,
  Scissors,
  Share2,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "darkraise-ui/components/context-menu"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/context-menu")(
  {
    component: ContextMenuPage,
  },
)

const COMPLEX_CODE = `const [sortBy, setSortBy] = useState("name")
const [showHidden, setShowHidden] = useState(true)
const [previewPane, setPreviewPane] = useState(false)
const [statusBar, setStatusBar] = useState(true)

<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="...">report-q3.pdf</div>
  </ContextMenuTrigger>
  <ContextMenuContent className="w-60">
    <ContextMenuLabel>report-q3.pdf</ContextMenuLabel>
    <ContextMenuSeparator />

    <ContextMenuItem>
      <FileText />
      Open
      <ContextMenuShortcut>Enter</ContextMenuShortcut>
    </ContextMenuItem>

    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <AppWindow />
        Open with
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        <ContextMenuItem>Preview</ContextMenuItem>
        <ContextMenuItem>Text Editor</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Globe />
            Browser
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuItem>Chrome</ContextMenuItem>
            <ContextMenuItem>Firefox</ContextMenuItem>
            <ContextMenuItem>Safari</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <FilePlus />
        New
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        <ContextMenuItem>
          <FolderPlus />
          Folder
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FileText />
            Document
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Blank document</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>From template</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem>Invoice</ContextMenuItem>
                <ContextMenuItem>Letter</ContextMenuItem>
                <ContextMenuItem>Report</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem>
          <Link2 />
          Shortcut
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Share2 />
        Share
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        <ContextMenuItem>
          <Link />
          Copy link
        </ContextMenuItem>
        <ContextMenuItem>
          <Mail />
          Email
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Send to device</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>
              <Laptop />
              Work laptop
            </ContextMenuItem>
            <ContextMenuItem>
              <Smartphone />
              Phone
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Tablet />
              Tablet (offline)
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSeparator />

    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <ArrowUpDown />
        Sort by
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-40">
        <ContextMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">Date modified</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Eye />
        View
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48">
        <ContextMenuCheckboxItem
          checked={showHidden}
          onCheckedChange={setShowHidden}
        >
          Hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={previewPane}
          onCheckedChange={setPreviewPane}
        >
          Preview pane
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={statusBar}
          onCheckedChange={setStatusBar}
        >
          Status bar
        </ContextMenuCheckboxItem>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSeparator />

    <ContextMenuItem>
      <Scissors />
      Cut
      <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Copy />
      Copy
      <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem disabled>
      <ClipboardPaste />
      Paste
      <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
    </ContextMenuItem>

    <ContextMenuSeparator />

    <ContextMenuItem>
      <Pencil />
      Rename
      <ContextMenuShortcut>F2</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem className="text-destructive">
      <Trash2 />
      Move to Trash
      <ContextMenuShortcut>Del</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`

function ComplexFileMenu() {
  const [sortBy, setSortBy] = useState("name")
  const [showHidden, setShowHidden] = useState(true)
  const [previewPane, setPreviewPane] = useState(false)
  const [statusBar, setStatusBar] = useState(true)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <FileText className="text-muted-foreground h-8 w-8" />
          <p className="text-sm font-medium">report-q3.pdf</p>
          <p className="text-muted-foreground text-xs">
            Right-click for the full menu
          </p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuLabel>report-q3.pdf</ContextMenuLabel>
        <ContextMenuSeparator />

        <ContextMenuItem>
          <FileText />
          Open
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AppWindow />
            Open with
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Preview</ContextMenuItem>
            <ContextMenuItem>Text Editor</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Globe />
                Browser
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-40">
                <ContextMenuItem>Chrome</ContextMenuItem>
                <ContextMenuItem>Firefox</ContextMenuItem>
                <ContextMenuItem>Safari</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FilePlus />
            New
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <FolderPlus />
              Folder
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FileText />
                Document
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem>Blank document</ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>From template</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-40">
                    <ContextMenuItem>Invoice</ContextMenuItem>
                    <ContextMenuItem>Letter</ContextMenuItem>
                    <ContextMenuItem>Report</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem>
              <Link2 />
              Shortcut
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Share2 />
            Share
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <Link />
              Copy link
            </ContextMenuItem>
            <ContextMenuItem>
              <Mail />
              Email
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Send to device</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem>
                  <Laptop />
                  Work laptop
                </ContextMenuItem>
                <ContextMenuItem>
                  <Smartphone />
                  Phone
                </ContextMenuItem>
                <ContextMenuItem disabled>
                  <Tablet />
                  Tablet (offline)
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ArrowUpDown />
            Sort by
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
              <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
              <ContextMenuRadioItem value="date">
                Date modified
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Eye />
            View
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuCheckboxItem
              checked={showHidden}
              onCheckedChange={setShowHidden}
            >
              Hidden files
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={previewPane}
              onCheckedChange={setPreviewPane}
            >
              Preview pane
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem
              checked={statusBar}
              onCheckedChange={setStatusBar}
            >
              Status bar
            </ContextMenuCheckboxItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem>
          <Scissors />
          Cut
          <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <ClipboardPaste />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem>
          <Pencil />
          Rename
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem className="text-destructive">
          <Trash2 />
          Move to Trash
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ContextMenuPage() {
  return (
    <ShowcasePage
      title="Context Menu"
      description="Right-click anchored menu. Same item primitives as DropdownMenu but triggered by the platform contextmenu event (right-click on desktop, long-press on touch)."
    >
      <ShowcaseExample
        title="Basic actions"
        code={`<ContextMenu>
  <ContextMenuTrigger asChild>
    <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      Right-click here
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>Select All</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="text-muted-foreground flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm">
              Right-click here
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
            <ContextMenuItem>Paste</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Select All</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive">
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ShowcaseExample>

      <ShowcaseExample title="Complex nested menu" code={COMPLEX_CODE}>
        <ComplexFileMenu />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
