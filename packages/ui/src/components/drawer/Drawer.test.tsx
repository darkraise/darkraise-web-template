import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@components/drawer"

function Basic({
  onChange,
  direction = "bottom",
}: {
  onChange?: (open: boolean) => void
  direction?: "top" | "right" | "bottom" | "left"
} = {}) {
  return (
    <Drawer onOpenChange={onChange} direction={direction}>
      <DrawerTrigger>Open drawer</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

describe("Drawer", () => {
  it("does not render content while closed", () => {
    render(<Basic />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("opens on trigger click and renders role=dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute("data-state", "open")
  })

  it("trigger reflects aria-expanded state", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Open drawer" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  it("Escape closes the drawer", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Basic onChange={onChange} />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    await screen.findByRole("dialog")
    await user.keyboard("{Escape}")
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("DrawerClose closes the drawer", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    await screen.findByRole("dialog")
    // Use the text-labeled DrawerClose (not the icon-only OverlayCloseButton).
    const drawerClose = screen.getAllByRole("button", { name: "Close" })[0]
    if (!drawerClose) throw new Error("DrawerClose button not found")
    await user.click(drawerClose)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("outside pointerdown closes the drawer", async () => {
    const user = userEvent.setup()
    const root = document.createElement("div")
    const outside = document.createElement("button")
    outside.textContent = "outside"
    document.body.append(root, outside)
    render(<Basic />, { container: root })
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    await screen.findByRole("dialog")
    await user.click(outside)
    expect(screen.queryByRole("dialog")).toBeNull()
    root.remove()
    outside.remove()
  })

  it("controlled open prop works", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(false)
      return (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger>Open drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Hi</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("dialog has aria-labelledby linked to title and aria-describedby to description", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    const dialog = await screen.findByRole("dialog")
    const title = screen.getByText("Drawer title")
    const desc = screen.getByText("Drawer description")
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id)
    expect(dialog.getAttribute("aria-describedby")).toBe(desc.id)
  })

  it("data-direction reflects the direction prop", async () => {
    const user = userEvent.setup()
    render(<Basic direction="right" />)
    await user.click(screen.getByRole("button", { name: "Open drawer" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("data-direction", "right")
  })
})
