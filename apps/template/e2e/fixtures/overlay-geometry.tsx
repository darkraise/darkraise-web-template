import { useLayoutEffect, useState, type ReactElement } from "react"
import { createRoot } from "react-dom/client"
import { ChevronDown } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "darkraise-ui/components/combobox"
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "darkraise-ui/components/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "darkraise-ui/components/drawer"
import {
  DropdownMenu,
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
  MenubarTrigger,
} from "darkraise-ui/components/menubar"
import {
  FloatingPanel,
  FloatingPanelContent,
  FloatingPanelHeader,
  FloatingPanelTitle,
} from "darkraise-ui/components/floating-panel"
import { MultiSelect } from "darkraise-ui/components/multi-select"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "darkraise-ui/components/navigation-menu"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "darkraise-ui/components/sheet"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "darkraise-ui/components/tooltip"
import { Tour } from "darkraise-ui/components/tour"
import {
  VirtualizedDropdownMenu,
  VirtualizedDropdownMenuContent,
  VirtualizedDropdownMenuItem,
  VirtualizedDropdownMenuTrigger,
} from "darkraise-ui/components/virtualized-dropdown-menu"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

// The trigger scrolls inside a box and the box is centred, so both a scroll
// and a viewport resize move the trigger without moving the page.
function FollowCase() {
  return (
    <div
      data-testid="scroll-box"
      style={{
        width: 480,
        height: 320,
        margin: "120px auto 0",
        overflow: "auto",
        border: "1px solid",
      }}
    >
      <div
        style={{
          height: 1200,
          paddingTop: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button>Anchor</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="follow-popover">
            Attached to the anchor
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function OriginCase() {
  return (
    <div
      style={{
        display: "flex",
        gap: 48,
        justifyContent: "center",
        paddingTop: 300,
      }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open above</Button>
        </PopoverTrigger>
        <PopoverContent side="top" data-testid="popover-top">
          Opens above its trigger
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open below</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" data-testid="popover-bottom">
          Opens below its trigger
        </PopoverContent>
      </Popover>
      <Select>
        <SelectTrigger style={{ width: 320 }} aria-label="Fruit">
          <SelectValue placeholder="Fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fig">Fig</SelectItem>
          <SelectItem value="kiwi">Kiwi</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

const SIXTY = Array.from({ length: 60 }, (_, i) => `Item ${i + 1}`)

// Triggers pinned to the bottom edge, so every list is taller than the room
// on either side of its trigger.
function MenusCase() {
  return (
    <div
      style={{
        position: "fixed",
        left: 24,
        right: 24,
        bottom: 24,
        display: "flex",
        gap: 24,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Long menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More items</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {SIXTY.map((label) => (
                <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {SIXTY.map((label) => (
            <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            {SIXTY.map((label) => (
              <MenubarItem key={label}>{label}</MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  )
}

function ContextSubmenuCase() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        style={{
          display: "block",
          width: 320,
          height: 160,
          margin: 48,
          border: "1px dashed",
        }}
      >
        Context area
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem>Last</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// The nav sits at the inline end of a header that clips its overflow, with
// page content below, so a panel hanging from its item runs off screen and
// is cut off by the header.
function NavigationCase({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <div dir={dir}>
      <header
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          height: 48,
          padding: "0 16px",
          overflow: "hidden",
          borderBottom: "1px solid",
        }}
      >
        <NavigationMenu>
          <NavigationMenuList>
            {["Products", "Company"].map((label) => (
              <NavigationMenuItem key={label} value={label.toLowerCase()}>
                <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div style={{ display: "grid", width: 320, padding: 12 }}>
                    {["Overview", "Pricing", "Changelog"].map((link) => (
                      <NavigationMenuLink key={link} href={`#${link}`}>
                        {label} {link}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
          <NavigationMenuIndicator data-testid="nav-indicator" />
        </NavigationMenu>
      </header>
      <p data-testid="after-nav" style={{ height: 400, margin: 16 }}>
        Following content
      </p>
    </div>
  )
}

// The kit stylesheet keeps html and body at full height with hidden
// overflow; a page that lets the document scroll undoes that, so the root
// has a scrollbar for the scroll lock to compensate. The last header
// control sits at the inline end.
function ScrollLockCase({ dir }: { dir: "ltr" | "rtl" }) {
  useLayoutEffect(() => {
    const { documentElement: html, body } = document
    html.dir = dir
    for (const element of [html, body]) {
      element.style.height = "auto"
      element.style.overflow = "visible"
    }
  }, [dir])
  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 8,
          borderBottom: "1px solid",
        }}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Locked by a dialog</DialogTitle>
          </DialogContent>
        </Dialog>
        <Drawer>
          <DrawerTrigger asChild>
            <Button>Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Locked by a drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
        <Button data-testid="inline-end">Account</Button>
      </header>
      <div style={{ height: 3000 }} />
    </>
  )
}

const THOUSAND = Array.from({ length: 1000 }, (_, i) => `Row ${i + 1}`)

// A tall list under a trigger near the top: the list is taller than the
// room below, so the popup is capped by the room left.
function VirtualizedCase() {
  return (
    <div style={{ padding: 16 }}>
      <VirtualizedDropdownMenu>
        <VirtualizedDropdownMenuTrigger asChild>
          <Button>Many rows</Button>
        </VirtualizedDropdownMenuTrigger>
        <VirtualizedDropdownMenuContent items={THOUSAND} maxHeight={600}>
          {(item, { isActive, disabled }) => (
            <VirtualizedDropdownMenuItem
              isActive={isActive}
              disabled={disabled}
            >
              {item}
            </VirtualizedDropdownMenuItem>
          )}
        </VirtualizedDropdownMenuContent>
      </VirtualizedDropdownMenu>
    </div>
  )
}

const COUNTRIES = [
  "Argentina",
  "Brazil",
  "Canada",
  "Denmark",
  "Egypt",
  "France",
  "Germany",
  "Hungary",
  "India",
  "Japan",
  "Kenya",
  "Mexico",
].map((label) => ({ value: label.toLowerCase(), label }))

function CountryCombobox() {
  return (
    <Combobox items={COUNTRIES} placeholder="Country">
      <ComboboxLabel>Country</ComboboxLabel>
      <ComboboxControl>
        <ComboboxInput />
        <ComboboxTrigger aria-label="Show countries">
          <ChevronDown className="size-4" aria-hidden="true" />
        </ComboboxTrigger>
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxList>
          {COUNTRIES.map((item) => (
            <ComboboxItem key={item.value} item={item}>
              <ComboboxItemText>{item.label}</ComboboxItemText>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// A combobox at the bottom of a scrolled dialog, and a multi-select in a
// short scroll box pinned to the viewport's bottom edge: neither list has
// room below its field.
function ComboboxCase() {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Shipping</DialogTitle>
          <div style={{ height: 900 }} />
          <CountryCombobox />
        </DialogContent>
      </Dialog>
      <div
        data-testid="scroll-box"
        style={{
          position: "fixed",
          left: 24,
          right: 24,
          bottom: 24,
          height: 120,
          overflow: "auto",
        }}
      >
        <MultiSelect items={COUNTRIES} placeholder="Tags" />
      </div>
    </>
  )
}

const ROWS = Array.from({ length: 100 }, (_, i) => `Row ${i + 1}`)

function RowList() {
  return (
    <div>
      {ROWS.map((row) => (
        <p key={row} style={{ padding: "8px 0" }}>
          {row}
        </p>
      ))}
    </div>
  )
}

function SheetsCase() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 24 }}>
      {(["top", "bottom"] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button>{`Open ${side} sheet`}</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{`Long ${side} sheet`}</SheetTitle>
            </SheetHeader>
            <RowList />
          </SheetContent>
        </Sheet>
      ))}
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open pinned sheet</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Pinned sheet</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <RowList />
          </SheetBody>
          <SheetFooter>
            <Button>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TourCase() {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(true)
  return (
    <>
      <div
        id="tour-right"
        style={{ position: "fixed", top: 120, right: 8, width: 80, height: 40 }}
      >
        Right target
      </div>
      <div
        id="tour-bottom"
        style={{
          position: "fixed",
          bottom: 8,
          left: 600,
          width: 80,
          height: 40,
        }}
      >
        Bottom target
      </div>
      <Tour
        open={open}
        current={current}
        onChange={setCurrent}
        onClose={() => setOpen(false)}
        steps={[
          {
            targetSelector: "#tour-right",
            title: "Right edge",
            description: "This target sits against the right edge.",
          },
          {
            targetSelector: "#tour-bottom",
            title: "Bottom edge",
            description: "This target sits against the bottom edge.",
          },
        ]}
      />
    </>
  )
}

// The chart, contribution-graph and timeline surfaces appear only on hover;
// their rules apply to the class, so a bare element carrying it is enough.
function RecipeCase() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: 24 }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button>Reference</Button>
        </PopoverTrigger>
        <PopoverContent data-testid="reference-popover">
          Reference
        </PopoverContent>
      </Popover>
      <div className="dr-chart-tooltip">Chart tooltip</div>
      <div style={{ position: "relative", width: 200, height: 60 }}>
        <div className="dr-contribution-graph-tooltip">
          Contribution tooltip
        </div>
      </div>
      <div style={{ position: "relative", width: 200, height: 60 }}>
        <div className="dr-virtualized-timeline-scrubber-label">2026</div>
      </div>
      <div id="recipe-target" style={{ width: 120, height: 40 }}>
        Tour target
      </div>
      <FloatingPanel
        scope="global"
        defaultPosition={{ x: 600, y: 300 }}
        defaultSize={{ width: 240, height: 160 }}
      >
        <FloatingPanelHeader>
          <FloatingPanelTitle>Panel</FloatingPanelTitle>
        </FloatingPanelHeader>
        <FloatingPanelContent>Panel body</FloatingPanelContent>
      </FloatingPanel>
      <Tour
        open
        current={0}
        onChange={() => undefined}
        onClose={() => undefined}
        steps={[{ targetSelector: "#recipe-target", title: "Recipe" }]}
      />
    </div>
  )
}

// Three global panels that all cover the viewport centre, where the dialog
// opens; the dialog trigger sits in a corner no panel covers.
function PanelsCase() {
  return (
    <>
      <div style={{ position: "fixed", top: 8, left: 8 }}>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Above the panels</DialogTitle>
            <p>The dialog covers every panel.</p>
          </DialogContent>
        </Dialog>
      </div>
      {(["a", "b", "c"] as const).map((id, i) => (
        <FloatingPanel
          key={id}
          scope="global"
          defaultPosition={{ x: 400 + i * 40, y: 200 + i * 20 }}
          defaultSize={{ width: 400, height: 300 }}
          data-testid={`panel-${id}`}
        >
          <FloatingPanelHeader>
            <FloatingPanelTitle>{`Panel ${id}`}</FloatingPanelTitle>
          </FloatingPanelHeader>
          <FloatingPanelContent>{`Panel ${id} body`}</FloatingPanelContent>
        </FloatingPanel>
      ))}
    </>
  )
}

type ArrowSide = "top" | "right" | "bottom" | "left"

// One open popup per page load. The trigger sits near the centre, so no side
// flips, and on whole pixels, so the popup and its arrow do too. The arrow is
// large enough to read a pixel inside it clear of its anti-aliased edges.
function ArrowCase({
  kind,
  side,
}: {
  kind: "popover" | "tooltip"
  side: ArrowSide
}) {
  const trigger = <Button data-testid="arrow-trigger">Anchor</Button>
  return (
    <div style={{ position: "fixed", left: 560, top: 320 }}>
      {kind === "popover" ? (
        <Popover defaultOpen>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            side={side}
            sideOffset={12}
            data-testid="arrow-content"
          >
            Popover with an arrow
            <PopoverArrow width={24} height={12} data-testid="arrow" />
          </PopoverContent>
        </Popover>
      ) : (
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent
            side={side}
            sideOffset={12}
            data-testid="arrow-content"
          >
            Tooltip with an arrow
            <TooltipArrow width={24} height={12} data-testid="arrow" />
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

const ARROW_CASES = Object.fromEntries(
  (["popover", "tooltip"] as const).flatMap((kind) =>
    (["top", "right", "bottom", "left"] as const).map((side) => [
      `arrow-${kind}-${side}`,
      () => <ArrowCase kind={kind} side={side} />,
    ]),
  ),
)

// One scenario per page load, chosen by ?case=, so a case's fixed triggers
// and open overlays never shift another case's geometry.
const CASES: Record<string, () => ReactElement> = {
  follow: FollowCase,
  origin: OriginCase,
  menus: MenusCase,
  "context-submenu": ContextSubmenuCase,
  navigation: () => <NavigationCase dir="ltr" />,
  "navigation-rtl": () => <NavigationCase dir="rtl" />,
  "scroll-lock": () => <ScrollLockCase dir="ltr" />,
  "scroll-lock-rtl": () => <ScrollLockCase dir="rtl" />,
  virtualized: VirtualizedCase,
  combobox: ComboboxCase,
  panels: PanelsCase,
  tour: TourCase,
  recipe: RecipeCase,
  sheets: SheetsCase,
  ...ARROW_CASES,
}

const name = new URLSearchParams(window.location.search).get("case") ?? ""
const Case = CASES[name]

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div data-testid="overlay-case" data-case={name}>
      {Case ? <Case /> : <p>Unknown case: {name}</p>}
    </div>
  </ThemeProvider>,
)
