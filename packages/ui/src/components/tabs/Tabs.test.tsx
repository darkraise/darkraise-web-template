import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
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

  it("exposes variant and color on the root for layout rules", () => {
    const { container } = render(
      <Tabs variant="enclosed" color="accent" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    const root = container.querySelector(".dr-tabs")
    expect(root).toHaveAttribute("data-variant", "enclosed")
    expect(root).toHaveAttribute("data-color", "accent")
    expect(root).toHaveAttribute("data-orientation", "horizontal")
  })

  it("merges a consumer className onto the root", () => {
    const { container } = render(
      <Tabs className="custom-root" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.firstChild).toHaveClass("dr-tabs", "custom-root")
  })

  it("propagates the vertical orientation to root, list, trigger, and content", () => {
    const { container } = render(
      <Tabs orientation="vertical" variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    for (const el of [
      container.querySelector(".dr-tabs"),
      container.querySelector(".dr-tabs-list"),
      screen.getByRole("tab", { name: "Tab One" }),
      screen.getByRole("tabpanel"),
    ]) {
      expect(el).toHaveAttribute("data-orientation", "vertical")
    }
  })

  it("renders a decorative indicator inside the tablist", () => {
    const { container } = render(<TestTabs />)
    const indicator = container.querySelector(".dr-tabs-indicator")
    expect(indicator).toBeInTheDocument()
    expect(indicator?.parentElement).toHaveClass("dr-tabs-list")
    expect(indicator).toHaveAttribute("aria-hidden", "true")
    // It must not join the tablist's accessibility tree.
    expect(screen.getAllByRole("tab")).toHaveLength(2)
  })

  it("mirrors variant, color, and orientation onto the indicator", () => {
    const { container } = render(
      <Tabs
        variant="underline"
        color="accent"
        orientation="vertical"
        defaultValue="tab-1"
      >
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    const indicator = container.querySelector(".dr-tabs-indicator")
    expect(indicator).toHaveAttribute("data-variant", "underline")
    expect(indicator).toHaveAttribute("data-color", "accent")
    expect(indicator).toHaveAttribute("data-orientation", "vertical")
  })

  it("marks the indicator inactive when no tab is selected", () => {
    const { container } = render(
      <Tabs defaultValue="">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.querySelector(".dr-tabs-indicator")).toHaveAttribute(
      "data-active",
      "false",
    )
  })

  it("suppresses the indicator transition until after first paint", () => {
    const { container } = render(<TestTabs />)
    // data-mounted gates the CSS transition; it must start false so the
    // indicator does not slide in from the strip's origin on mount.
    expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
      "data-mounted",
      "false",
    )
  })

  it("keeps the indicator tracking the active tab after a switch", async () => {
    const user = userEvent.setup()
    const { container } = render(<TestTabs />)
    await user.click(screen.getByRole("tab", { name: "Tab Two" }))
    expect(container.querySelector(".dr-tabs-indicator")).toHaveAttribute(
      "data-active",
      "true",
    )
  })

  it("moves between vertical tabs with the up and down arrows", async () => {
    const user = userEvent.setup()
    render(
      <Tabs orientation="vertical" variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          <TabsTrigger value="tab-2">Tab Two</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
        <TabsContent value="tab-2">Panel Two</TabsContent>
      </Tabs>,
    )
    screen.getByRole("tab", { name: "Tab One" }).focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveFocus()
    expect(screen.getByText("Panel Two")).toBeInTheDocument()
    await user.keyboard("{ArrowUp}")
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveFocus()
  })

  // The enclosed indicator's fill erases the strip's painted seam line into
  // the folder notch, so a rounded measurement leaves a slice of that line
  // showing down the active tab's seam edge — a visible hairline once the
  // line carries the brand hue (color="accent") at fractional device scale.
  it("sizes the enclosed indicator from sub-pixel geometry", () => {
    const stub = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const width = this.classList.contains("dr-tabs-list") ? 65.15625 : 0
        const isTab = this.getAttribute("role") === "tab"
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: isTab ? 65.15625 : width,
          height: isTab ? 33.5 : 0,
          toJSON: () => ({}),
        } as DOMRect
      })
    try {
      const { container } = render(
        <Tabs orientation="vertical" variant="enclosed" defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1">Panel One</TabsContent>
        </Tabs>,
      )
      const indicator =
        container.querySelector<HTMLElement>(".dr-tabs-indicator")
      expect(indicator?.style.width).toBe("65.15625px")
      expect(indicator?.style.height).toBe("33.5px")
    } finally {
      stub.mockRestore()
    }
  })

  // Every other variant keeps offsetWidth/offsetHeight: those report the
  it("leaves the strip unframed when border is omitted", () => {
    const { container } = render(<TestTabs />)
    expect(container.querySelector(".dr-tabs-list")).not.toHaveAttribute(
      "data-border",
    )
  })

  it("mirrors every border tier onto the strip", () => {
    for (const tier of ["default", "strong", "accent", "none"] as const) {
      const { container, unmount } = render(
        <Tabs variant="underline" border={tier} defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Tab One</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1">Panel One</TabsContent>
        </Tabs>,
      )
      // The tier rides the strip, not the root: the frame is the list's
      // chrome, and `default` still has to reach the DOM — unlike Card, it
      // is what turns the box on for variants that draw none.
      expect(container.querySelector(".dr-tabs-list")).toHaveAttribute(
        "data-border",
        tier,
      )
      unmount()
    }
  })

  // untransformed layout box, and the Playful preset scales the active
  // trigger. Measuring its client rect would fold that scale into the
  // indicator's size on top of the scale the indicator carries itself.
  it("keeps the non-enclosed indicator on untransformed offsets", () => {
    const stub = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(
        () =>
          ({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: 65.15625,
            height: 33.5,
            toJSON: () => ({}),
          }) as DOMRect,
      )
    try {
      const { container } = render(<TestTabs />)
      const indicator =
        container.querySelector<HTMLElement>(".dr-tabs-indicator")
      // jsdom reports 0 for every offset*, so the absence of the stubbed
      // fractional values is what proves the rect path was not taken.
      expect(indicator?.style.width).toBe("0px")
    } finally {
      stub.mockRestore()
    }
  })

  it("forwards surfaceIntensity to the content panel", () => {
    render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" surfaceIntensity="bold">
          Panel One
        </TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-surface-intensity",
      "bold",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", () => {
    render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" surfaceIntensity="balanced">
          Panel One
        </TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })

  it("puts data-surface-intensity on the root when set", () => {
    const { container } = render(
      <Tabs surfaceIntensity="bold" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.querySelector(".dr-tabs")).toHaveAttribute(
      "data-surface-intensity",
      "bold",
    )
  })

  it("omits data-surface-intensity from the root when unset", () => {
    const { container } = render(<TestTabs />)
    expect(container.querySelector(".dr-tabs")).not.toHaveAttribute(
      "data-surface-intensity",
    )
  })

  it("emits the root attribute for balanced, not filtered to undefined", () => {
    const { container } = render(
      <Tabs surfaceIntensity="balanced" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    expect(container.querySelector(".dr-tabs")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })

  // The enclosed indicator is a DOM sibling of the content panel, not a
  // descendant of it, so a `surfaceIntensity` set on `TabsContent` alone
  // cannot reach it. Both sit under the root, so a root-level value is what
  // keeps the indicator and the active panel washed as one continuous
  // surface. This asserts the enclosure that justifies the root prop.
  it("encloses both the enclosed indicator and the content panel in the root", () => {
    const { container } = render(
      <Tabs surfaceIntensity="bold" variant="enclosed" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">Panel One</TabsContent>
      </Tabs>,
    )
    const root = container.querySelector(".dr-tabs")
    const indicator = container.querySelector(".dr-tabs-indicator")
    const panel = screen.getByRole("tabpanel")
    expect(root).toHaveAttribute("data-surface-intensity", "bold")
    expect(indicator).not.toBeNull()
    expect(root?.contains(indicator)).toBe(true)
    expect(root?.contains(panel)).toBe(true)
  })

  it("lets a TabsContent-level value override the root for its own panel", () => {
    render(
      <Tabs surfaceIntensity="bold" defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1" surfaceIntensity="subtle">
          Panel One
        </TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "data-surface-intensity",
      "subtle",
    )
  })
})
