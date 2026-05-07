import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@components/dialog"

function Basic({ onChange }: { onChange?: (open: boolean) => void } = {}) {
  return (
    <Dialog onOpenChange={onChange}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>The title</DialogTitle>
        <DialogDescription>The description</DialogDescription>
        <button>Inside button</button>
        <DialogClose>Dismiss</DialogClose>
      </DialogContent>
    </Dialog>
  )
}

describe("Dialog", () => {
  it("does not render content while closed", () => {
    render(<Basic />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens on trigger click and renders role=dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute("aria-modal", "true")
    expect(dialog).toHaveAttribute("data-state", "open")
  })

  it("links aria-labelledby to title and aria-describedby to description", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    const dialog = await screen.findByRole("dialog")
    const title = screen.getByText("The title")
    const desc = screen.getByText("The description")
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id)
    expect(dialog.getAttribute("aria-describedby")).toBe(desc.id)
  })

  it("Escape closes the dialog", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Basic onChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("DialogClose closes the dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("outside pointerdown closes the dialog", async () => {
    const user = userEvent.setup()
    const root = document.createElement("div")
    const outside = document.createElement("button")
    outside.textContent = "outside"
    document.body.append(root, outside)
    render(<Basic />, { container: root })
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    await user.click(outside)
    expect(screen.queryByRole("dialog")).toBeNull()
    root.remove()
    outside.remove()
  })

  it("controlled open works", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Hi</DialogTitle>
          </DialogContent>
        </Dialog>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("respects defaultOpen", () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hi</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("locks body scroll while open and restores on close", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    expect(document.body.style.overflow).toBe("")
    await user.click(screen.getByRole("button", { name: "Open" }))
    await screen.findByRole("dialog")
    expect(document.body.style.overflow).toBe("hidden")
    await user.keyboard("{Escape}")
    expect(document.body.style.overflow).toBe("")
  })

  it("trigger reflects data-state and aria-expanded", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Open" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveAttribute("data-state", "closed")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(trigger).toHaveAttribute("data-state", "open")
  })
})
