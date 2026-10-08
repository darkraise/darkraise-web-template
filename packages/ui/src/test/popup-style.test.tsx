import { render, screen } from "@testing-library/react"
import type * as React from "react"
import { describe, expect, it } from "vitest"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@components/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@components/hover-card"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@components/menubar"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/tooltip"

const style: React.CSSProperties = { color: "red" }

const cases: Array<[string, () => React.ReactElement]> = [
  [
    "DropdownMenuContent",
    () => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent data-testid="content" style={style}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  ],
  [
    "ContextMenuContent",
    () => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>Area</ContextMenuTrigger>
        <ContextMenuContent data-testid="content" style={style}>
          <ContextMenuItem>Item</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  ],
  [
    "MenubarContent",
    () => (
      <Menubar defaultValue="file">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent data-testid="content" style={style}>
            <MenubarItem>Item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    ),
  ],
  [
    "SelectContent",
    () => (
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent data-testid="content" style={style}>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    ),
  ],
  [
    "PopoverContent",
    () => (
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent data-testid="content" style={style}>
          Body
        </PopoverContent>
      </Popover>
    ),
  ],
  [
    "TooltipContent",
    () => (
      <Tooltip defaultOpen>
        <TooltipTrigger>Open</TooltipTrigger>
        <TooltipContent data-testid="content" style={style}>
          Tip
        </TooltipContent>
      </Tooltip>
    ),
  ],
  [
    "HoverCardContent",
    () => (
      <HoverCard defaultOpen>
        <HoverCardTrigger href="#">Open</HoverCardTrigger>
        <HoverCardContent data-testid="content" style={style}>
          Card
        </HoverCardContent>
      </HoverCard>
    ),
  ],
]

describe("popup content with a consumer style", () => {
  it.each(cases)("%s keeps its position and the style", async (_, make) => {
    render(make())
    const content = await screen.findByTestId("content")
    expect(content.style.position).not.toBe("")
    expect(content.style.top).not.toBe("")
    expect(content.style.left).not.toBe("")
    expect(content.style.color).toBe("red")
  })
})
