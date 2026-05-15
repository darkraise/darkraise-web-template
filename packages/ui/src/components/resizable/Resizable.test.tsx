import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@components/resizable"

function Basic({
  orientation = "horizontal" as "horizontal" | "vertical",
} = {}) {
  return (
    <ResizablePanelGroup orientation={orientation}>
      <ResizablePanel defaultSize={50} id="left">
        Left
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} id="right">
        Right
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

describe("Resizable", () => {
  it("renders panel group with flex layout attribute", () => {
    render(<Basic />)
    const group = screen
      .getByText("Left")
      .closest("[data-panel-group-direction]")
    expect(group).toHaveAttribute("data-panel-group-direction", "horizontal")
  })

  it("renders panels with data-panel attribute", () => {
    render(<Basic />)
    const panels = document.querySelectorAll("[data-panel]")
    expect(panels).toHaveLength(2)
  })

  it("handle has role=separator with ARIA value attributes", async () => {
    render(<Basic />)
    // Wait for panel registration to propagate sizes
    const separator = await screen.findByRole("separator")
    expect(separator).toHaveAttribute("aria-valuemin", "0")
    expect(separator).toHaveAttribute("aria-valuemax", "100")
    expect(separator).toHaveAttribute("aria-orientation", "vertical")
  })

  it("handle is focusable by default", () => {
    render(<Basic />)
    const handle = screen.getByRole("separator")
    expect(handle).toHaveAttribute("tabindex", "0")
  })

  it("disabled handle is not focusable", () => {
    render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle disabled />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    )
    const handle = screen.getByRole("separator")
    expect(handle).toHaveAttribute("tabindex", "-1")
    expect(handle).toHaveAttribute("data-disabled")
  })

  it("ArrowLeft keyboard nudge does not crash", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const handle = screen.getByRole("separator")
    handle.focus()
    await user.keyboard("{ArrowLeft}")
    // No error; aria-valuenow should still be present
    expect(handle).toBeInTheDocument()
  })

  it("ArrowRight keyboard nudge does not crash", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const handle = screen.getByRole("separator")
    handle.focus()
    await user.keyboard("{ArrowRight}")
    expect(handle).toBeInTheDocument()
  })

  it("vertical orientation sets correct aria-orientation on handle", () => {
    render(<Basic orientation="vertical" />)
    const handle = screen.getByRole("separator")
    expect(handle).toHaveAttribute("aria-orientation", "horizontal")
  })

  it("withHandle renders grip element inside handle", () => {
    render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>A</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>B</ResizablePanel>
      </ResizablePanelGroup>,
    )
    const grip = document.querySelector(".dr-resizable-handle-grip")
    expect(grip).toBeInTheDocument()
  })

  it("drag delta is computed against the panel group, not the handle itself", () => {
    // Regression guard for the "jump on drag start" bug: the panel group,
    // each panel, AND the handle all carry `data-panel-group-direction`, so
    // an attribute-based `closest()` from the handle would resolve to the
    // 1px-wide handle and turn every pixel of pointer movement into a 100%
    // delta. Drag startup uses the `.dr-resizable-panel-group` class
    // instead, which only the group root has.
    render(<Basic />)
    const handle = screen.getByRole("separator")
    const group = handle.closest(".dr-resizable-panel-group")
    expect(group).not.toBeNull()
    expect(group).not.toBe(handle)
    // The handle itself must not have the group's class.
    expect(handle.classList.contains("dr-resizable-panel-group")).toBe(false)
  })
})
