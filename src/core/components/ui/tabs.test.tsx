import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

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
    expect(screen.queryByText("Panel One")).not.toBeInTheDocument()
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
})
