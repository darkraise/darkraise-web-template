import type * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@components/navigation-menu"

function Keyboard() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#overview">Overview</NavigationMenuLink>
            <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem value="blog">
          <NavigationMenuTrigger>Blog</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#latest">Latest</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function Basic() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="docs">
          <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
          <NavigationMenuContent>
            <a href="#getting-started">Getting started</a>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="components">
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <a href="#button">Button</a>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

describe("NavigationMenu", () => {
  it("takes no orientation or delay props", () => {
    type Removed = Extract<
      keyof React.ComponentProps<typeof NavigationMenu>,
      "orientation" | "delayDuration" | "skipDelayDuration"
    >
    const removed: [Removed] extends [never] ? true : false = true
    expect(removed).toBe(true)
  })

  it("renders trigger buttons with the right ARIA wiring", () => {
    render(<Basic />)
    const docs = screen.getByRole("button", { name: /docs/i })
    expect(docs).not.toHaveAttribute("aria-haspopup")
    expect(docs).toHaveAttribute("aria-expanded", "false")
  })

  it("clicking trigger opens the matching content", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: /docs/i }))
    expect(
      await screen.findByRole("link", { name: "Getting started" }),
    ).toBeInTheDocument()
  })

  it("clicking another trigger swaps the open content", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: /docs/i }))
    expect(
      await screen.findByRole("link", { name: "Getting started" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /components/i }))
    expect(
      await screen.findByRole("link", { name: "Button" }),
    ).toBeInTheDocument()
  })

  it("clicking the open trigger closes it", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: /docs/i })
    await user.click(trigger)
    expect(
      await screen.findByRole("link", { name: "Getting started" }),
    ).toBeInTheDocument()
    await user.click(trigger)
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Getting started" }),
      ).toBeNull(),
    )
  })

  it("forwards surface to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="docs">
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent surface="page">
              <a href="#getting-started">Getting started</a>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    await user.click(screen.getByRole("button", { name: /docs/i }))
    const link = await screen.findByRole("link", { name: "Getting started" })
    expect(link.parentElement).toHaveAttribute("data-surface-fill", "page")
  })

  it("emits the attribute for card, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem value="docs">
            <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
            <NavigationMenuContent surface="card">
              <a href="#getting-started">Getting started</a>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )
    await user.click(screen.getByRole("button", { name: /docs/i }))
    const link = await screen.findByRole("link", { name: "Getting started" })
    expect(link.parentElement).toHaveAttribute("data-surface-fill", "card")
  })
})

describe("NavigationMenu keyboard", () => {
  it("does not open an item when its trigger takes focus", async () => {
    const user = userEvent.setup()
    render(<Keyboard />)
    await user.tab()
    const products = screen.getByRole("button", { name: /products/i })
    expect(products).toHaveFocus()
    expect(products).toHaveAttribute("aria-expanded", "false")
  })

  it("moves between top-level items with the arrows, Home and End", async () => {
    const user = userEvent.setup()
    render(<Keyboard />)
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    const blog = screen.getByRole("button", { name: /blog/i })
    expect(blog).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(blog).toHaveFocus()
    await user.keyboard("{Home}")
    const products = screen.getByRole("button", { name: /products/i })
    expect(products).toHaveFocus()
    await user.keyboard("{End}")
    expect(blog).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus()
    expect(products).toHaveAttribute("aria-expanded", "false")
    expect(blog).toHaveAttribute("aria-expanded", "false")
  })

  it("opens with ArrowDown, moves through the links and closes with Escape", async () => {
    const user = userEvent.setup()
    render(<Keyboard />)
    await user.tab()
    const products = screen.getByRole("button", { name: /products/i })
    await user.keyboard("{ArrowDown}")
    expect(products).toHaveAttribute("aria-expanded", "true")
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus(),
    )
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus()
    await user.keyboard("{Escape}")
    expect(products).toHaveAttribute("aria-expanded", "false")
    expect(products).toHaveFocus()
  })

  it("toggles with Enter and closes when Tab leaves the last link", async () => {
    const user = userEvent.setup()
    render(<Keyboard />)
    await user.tab()
    const products = screen.getByRole("button", { name: /products/i })
    await user.keyboard("{Enter}")
    expect(products).toHaveAttribute("aria-expanded", "true")
    await user.tab()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus()
    await user.tab()
    await user.tab()
    expect(screen.getByRole("link", { name: "Docs" })).toHaveFocus()
    expect(products).toHaveAttribute("aria-expanded", "false")
  })
})
