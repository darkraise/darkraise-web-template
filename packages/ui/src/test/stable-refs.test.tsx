import { render } from "@testing-library/react"
import type * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { ContextMenu, ContextMenuTrigger } from "@components/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { HoverCard, HoverCardTrigger } from "@components/hover-card"
import { Menubar, MenubarMenu, MenubarTrigger } from "@components/menubar"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@components/navigation-menu"
import { Popover, PopoverAnchor, PopoverTrigger } from "@components/popover"
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
