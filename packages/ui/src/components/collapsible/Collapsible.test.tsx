import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@components/collapsible"

describe("Collapsible", () => {
  it("renders trigger with aria-expanded=false initially", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hello</CollapsibleContent>
      </Collapsible>,
    )
    const btn = screen.getByRole("button")
    expect(btn).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Hello")).toBeNull()
  })

  it("opens on click", async () => {
    const user = userEvent.setup()
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hello</CollapsibleContent>
      </Collapsible>,
    )
    await user.click(screen.getByRole("button"))
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("respects defaultOpen", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hello</CollapsibleContent>
      </Collapsible>,
    )
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })

  it("controlled open works", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState(false)
      return (
        <Collapsible open={v} onOpenChange={setV}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hi</CollapsibleContent>
        </Collapsible>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Hi")).toBeInTheDocument()
  })

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Collapsible disabled onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hi</CollapsibleContent>
      </Collapsible>,
    )
    await user.click(screen.getByRole("button"))
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("trigger has aria-controls pointing at content id", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hi</CollapsibleContent>
      </Collapsible>,
    )
    const btn = screen.getByRole("button")
    const region = screen.getByRole("region")
    expect(btn.getAttribute("aria-controls")).toBe(region.id)
  })
})
