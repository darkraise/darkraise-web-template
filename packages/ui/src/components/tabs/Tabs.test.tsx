import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/tabs"

function TestTabs() {
  return (
    <Tabs defaultValue="tab-1">
      <TabsList>
        <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1">Panel One</TabsContent>
      <TabsContent value="tab-2">Panel Two</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("renders all tab triggers", () => {
    render(<TestTabs />)
    expect(screen.getByRole("tab", { name: "Tab One" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Tab Two" })).toBeInTheDocument()
  })

  it("shows the default tab panel on initial render", () => {
    render(<TestTabs />)
    expect(screen.getByText("Panel One")).toBeInTheDocument()
  })

  it("hides non-active tab panels on initial render", () => {
    render(<TestTabs />)
    expect(screen.queryByText("Panel Two")).not.toBeInTheDocument()
  })

  it("switches to the correct panel when a tab trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    expect(screen.getByText("Panel Two")).toBeInTheDocument()
  })

  it("hides the previous panel after switching tabs", async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    await waitFor(() =>
      expect(screen.queryByText("Panel One")).not.toBeInTheDocument(),
    )
  })

  it("marks the active tab trigger with aria-selected", async () => {
    const user = userEvent.setup()
    render(<TestTabs />)
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "aria-selected",
      "false",
    )
  })

  it("defaults data-variant to default on list, trigger, and content", () => {
    const { container } = render(<TestTabs />)
    expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
      "data-variant",
      "default",
    )
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "data-variant",
      "default",
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-variant",
      "default",
    )
  })

  it("propagates the root variant to list, trigger, and content", () => {
    const { container } = render(
      <Tabs variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
      "data-variant",
      "enclosed",
    )
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "data-variant",
      "enclosed",
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-variant",
      "enclosed",
    )
  })

  it("keeps tab switching working under a non-default variant", async () => {
    const user = userEvent.setup()
    render(
      <Tabs variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
        <TabsContent value="tab-2">Panel Two</TabsContent>
      </Tabs>,
    )
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    expect(screen.getByText("Panel Two")).toBeInTheDocument()
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-variant",
      "enclosed",
    )
  })

  it("keeps arrow-key navigation working under a non-default variant", async () => {
    const user = userEvent.setup()
    render(
      <Tabs variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
        <TabsContent value="tab-2">Panel Two</TabsContent>
      </Tabs>,
    )
    await user.tab()
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveFocus()
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  it("keeps arrow-key navigation working under the accent color", async () => {
    const user = userEvent.setup()
    render(
      <Tabs variant="enclosed" color="accent" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
        <TabsContent value="tab-2">Panel Two</TabsContent>
      </Tabs>,
    )
    await user.tab()
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveFocus()
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  it("keeps force-mounted panels hidden under a non-default variant", () => {
    const { container } = render(
      <Tabs variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" forceMount>
          Panel One
        </TabsContent>
        <TabsContent value="tab-2" forceMount>
          Panel Two
        </TabsContent>
      </Tabs>,
    )
    const panels = container.querySelectorAll(".dr-tabs-content")
    expect(panels).toHaveLength(2)
    // Both are mounted, but only the active one is exposed — no enclosed
    // rule touches `display`, so the hidden attribute still governs and
    // exactly one bordered panel is ever visible.
    expect(panels[0]).not.toHaveAttribute("hidden")
    expect(panels[1]).toHaveAttribute("hidden")
    for (const panel of panels) {
      expect(panel).toHaveAttribute("data-variant", "enclosed")
    }
  })

  it("defaults data-color to default on list, trigger, and content", () => {
    const { container } = render(<TestTabs />)
    expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
      "data-color",
      "default",
    )
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "data-color",
      "default",
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-color",
      "default",
    )
  })

  it("propagates the root color to list, trigger, and content", () => {
    const { container } = render(
      <Tabs variant="enclosed" color="accent" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
      "data-color",
      "accent",
    )
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveAttribute(
      "data-color",
      "accent",
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-color", "accent")
  })

  it("does not leak color onto the root as a legacy html attribute", () => {
    const { container } = render(
      <Tabs color="accent" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.firstChild).not.toHaveAttribute("color")
  })

  it("keeps tab switching working under the accent color", async () => {
    const user = userEvent.setup()
    render(
      <Tabs variant="enclosed" color="accent" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
        <TabsContent value="tab-2">Panel Two</TabsContent>
      </Tabs>,
    )
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    expect(screen.getByText("Panel Two")).toBeInTheDocument()
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-color", "accent")
  })
})
