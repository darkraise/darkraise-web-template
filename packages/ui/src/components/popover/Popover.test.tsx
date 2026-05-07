import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "@components/popover"

function Basic({ onChange }: { onChange?: (open: boolean) => void } = {}) {
  return (
    <Popover onOpenChange={onChange}>
      <PopoverTrigger>Toggle</PopoverTrigger>
      <PopoverContent>
        <p>Popover content</p>
        <PopoverClose>Close</PopoverClose>
      </PopoverContent>
    </Popover>
  )
}

describe("Popover", () => {
  it("does not render content when closed", () => {
    render(<Basic />)
    expect(screen.queryByText("Popover content")).toBeNull()
  })

  it("opens on trigger click", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    expect(await screen.findByText("Popover content")).toBeInTheDocument()
  })

  it("trigger has aria-expanded reflecting state", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Toggle" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  it("Escape closes the popover", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    await screen.findByText("Popover content")
    await user.keyboard("{Escape}")
    expect(screen.queryByText("Popover content")).toBeNull()
  })

  it("PopoverClose closes the popover", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    await screen.findByText("Popover content")
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByText("Popover content")).toBeNull()
  })

  it("outside pointerdown closes the popover", async () => {
    const user = userEvent.setup()
    const root = document.createElement("div")
    const outside = document.createElement("button")
    outside.textContent = "outside"
    document.body.append(root, outside)
    render(<Basic />, { container: root })
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    await screen.findByText("Popover content")
    await user.click(outside)
    expect(screen.queryByText("Popover content")).toBeNull()
    root.remove()
    outside.remove()
  })

  it("controlled open via prop", () => {
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )
    }
    render(<Controlled />)
    expect(screen.getByText("Content")).toBeInTheDocument()
  })

  it("calls onOpenChange when state changes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it("emits data-state on content", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    const content = await screen.findByText("Popover content")
    expect(content.parentElement).toHaveAttribute("data-state", "open")
  })
})
