import { render } from "@testing-library/react"
import type * as React from "react"
import { describe, expect, it, vi } from "vitest"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@components/accordion"
import { Checkbox } from "@components/checkbox"
import { Combobox, ComboboxControl, ComboboxInput } from "@components/combobox"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@components/context-menu"
import { Dialog, DialogContent, DialogTitle } from "@components/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "@components/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { HoverCard, HoverCardTrigger } from "@components/hover-card"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@components/menubar"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@components/navigation-menu"
import { Popover, PopoverAnchor, PopoverTrigger } from "@components/popover"
import { RadioGroup, RadioGroupItem } from "@components/radio-group"
import { ScrollArea, ScrollBar } from "@components/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import { Switch } from "@components/switch"
import { Tabs, TabsList, TabsTrigger } from "@components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { Tooltip, TooltipTrigger } from "@components/tooltip"
import { Slot } from "@primitives/slot"

type Ref = React.RefCallback<HTMLElement>

const cases: Array<[string, (ref: Ref, label: string) => React.ReactElement]> =
  [
    [
      "DropdownMenuTrigger",
      (ref, label) => (
        <DropdownMenu>
          <DropdownMenuTrigger ref={ref}>{label}</DropdownMenuTrigger>
        </DropdownMenu>
      ),
    ],
    [
      "DropdownMenuTrigger asChild child",
      (ref, label) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button ref={ref}>{label}</button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      ),
    ],
    [
      "DropdownMenuContent",
      (ref, label) => (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent ref={ref}>
            <DropdownMenuItem>{label}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    ],
    [
      "ContextMenuTrigger",
      (ref, label) => (
        <ContextMenu>
          <ContextMenuTrigger ref={ref}>{label}</ContextMenuTrigger>
        </ContextMenu>
      ),
    ],
    [
      "ContextMenuTrigger asChild child",
      (ref, label) => (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div ref={ref}>{label}</div>
          </ContextMenuTrigger>
        </ContextMenu>
      ),
    ],
    [
      "MenubarTrigger",
      (ref, label) => (
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger ref={ref}>{label}</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      ),
    ],
    [
      "PopoverTrigger",
      (ref, label) => (
        <Popover>
          <PopoverTrigger ref={ref}>{label}</PopoverTrigger>
        </Popover>
      ),
    ],
    [
      "PopoverAnchor",
      (ref, label) => (
        <Popover>
          <PopoverAnchor ref={ref}>{label}</PopoverAnchor>
        </Popover>
      ),
    ],
    [
      "TooltipTrigger",
      (ref, label) => (
        <Tooltip>
          <TooltipTrigger ref={ref}>{label}</TooltipTrigger>
        </Tooltip>
      ),
    ],
    [
      "HoverCardTrigger",
      (ref, label) => (
        <HoverCard>
          <HoverCardTrigger ref={ref}>{label}</HoverCardTrigger>
        </HoverCard>
      ),
    ],
    [
      "NavigationMenuTrigger",
      (ref, label) => (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem value="a">
              <NavigationMenuTrigger ref={ref}>{label}</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      ),
    ],
    [
      "DropdownMenuItem",
      (ref, label) => (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ref={ref}>{label}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    ],
    [
      "DropdownMenuItem asChild child",
      (ref, label) => (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <a href="#item" ref={ref}>
                {label}
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    ],
    [
      "DropdownMenuSubTrigger",
      (ref, label) => (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger ref={ref}>{label}</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    ],
    [
      "ContextMenuItem",
      (ref, label) => (
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Area</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem ref={ref}>{label}</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ),
    ],
    [
      "ContextMenuSubTrigger",
      (ref, label) => (
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Area</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger ref={ref}>{label}</ContextMenuSubTrigger>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      ),
    ],
    [
      "Menubar",
      (ref, label) => (
        <Menubar ref={ref}>
          <MenubarMenu value="file">
            <MenubarTrigger>{label}</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      ),
    ],
    [
      "MenubarItem",
      (ref, label) => (
        <Menubar defaultValue="file">
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem ref={ref}>{label}</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ),
    ],
    [
      "MenubarSubTrigger",
      (ref, label) => (
        <Menubar defaultValue="file">
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger ref={ref}>{label}</MenubarSubTrigger>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ),
    ],
    ["Checkbox", (ref, label) => <Checkbox ref={ref} aria-label={label} />],
    ["Switch", (ref, label) => <Switch ref={ref} aria-label={label} />],
    [
      "AccordionTrigger",
      (ref, label) => (
        <Accordion type="single">
          <AccordionItem value="a">
            <AccordionTrigger ref={ref}>{label}</AccordionTrigger>
          </AccordionItem>
        </Accordion>
      ),
    ],
    [
      "ToggleGroupItem",
      (ref, label) => (
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" ref={ref}>
            {label}
          </ToggleGroupItem>
        </ToggleGroup>
      ),
    ],
    [
      "RadioGroupItem",
      (ref, label) => (
        <RadioGroup aria-label={label}>
          <RadioGroupItem value="a" ref={ref} />
        </RadioGroup>
      ),
    ],
    [
      "TabsList",
      (ref, label) => (
        <Tabs defaultValue="a">
          <TabsList ref={ref}>
            <TabsTrigger value="a">{label}</TabsTrigger>
          </TabsList>
        </Tabs>
      ),
    ],
    [
      "TabsTrigger",
      (ref, label) => (
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a" ref={ref}>
              {label}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ),
    ],
    [
      "DialogContent",
      (ref, label) => (
        <Dialog defaultOpen>
          <DialogContent ref={ref}>
            <DialogTitle>{label}</DialogTitle>
          </DialogContent>
        </Dialog>
      ),
    ],
    [
      "DrawerContent",
      (ref, label) => (
        <Drawer defaultOpen>
          <DrawerContent ref={ref}>
            <DrawerTitle>{label}</DrawerTitle>
          </DrawerContent>
        </Drawer>
      ),
    ],
    [
      "SelectItem",
      (ref, label) => (
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a" ref={ref}>
              {label}
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    ],
    [
      "ComboboxControl",
      (ref, label) => (
        <Combobox items={[{ value: "a", label }]}>
          <ComboboxControl ref={ref}>
            <ComboboxInput />
          </ComboboxControl>
        </Combobox>
      ),
    ],
    ["ScrollArea", (ref, label) => <ScrollArea ref={ref}>{label}</ScrollArea>],
    [
      "ScrollBar",
      (ref, label) => (
        <ScrollArea type="always">
          {label}
          <ScrollBar ref={ref} />
        </ScrollArea>
      ),
    ],
    [
      "Slot child",
      (ref, label) => (
        <Slot className={label}>
          <button ref={ref}>{label}</button>
        </Slot>
      ),
    ],
  ]

describe("stable callback refs", () => {
  it.each(cases)("%s is not detached across a rerender", (_, make) => {
    const ref = vi.fn()
    const { rerender } = render(make(ref, "first"))
    rerender(make(ref, "second"))
    expect(ref).not.toHaveBeenCalledWith(null)
    expect(ref).toHaveBeenCalledTimes(1)
  })
})
