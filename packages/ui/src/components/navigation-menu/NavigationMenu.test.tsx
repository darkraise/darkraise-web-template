import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@components/navigation-menu"

function Basic() {
  return (
    <NavigationMenu delayDuration={0}>
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
  it("renders trigger buttons with the right ARIA wiring", () => {
    render(<Basic />)
    const docs = screen.getByRole("button", { name: /docs/i })
    expect(docs).toHaveAttribute("aria-haspopup", "menu")
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
})
