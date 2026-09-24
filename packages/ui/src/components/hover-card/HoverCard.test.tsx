import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@components/hover-card"
import { Dialog, DialogContent, DialogTitle } from "@components/dialog"

function Basic({
  openDelay = 0,
  closeDelay = 0,
}: { openDelay?: number; closeDelay?: number } = {}) {
  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger href="#">trigger</HoverCardTrigger>
      <HoverCardContent>card content</HoverCardContent>
    </HoverCard>
  )
}

function HoverCardInDialog({
  onDialogOpenChange,
}: {
  onDialogOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onDialogOpenChange(next)
        setOpen(next)
      }}
    >
      <DialogContent>
        <DialogTitle>Settings</DialogTitle>
        {/* Takes the dialog's initial focus, so opening it raises no card. */}
        <button type="button">Save</button>
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger href="#">trigger</HoverCardTrigger>
          <HoverCardContent>card content</HoverCardContent>
        </HoverCard>
      </DialogContent>
    </Dialog>
  )
}

describe("HoverCard", () => {
  it("does not render content initially", () => {
    render(<Basic />)
    expect(screen.queryByText("card content")).toBeNull()
  })

  it("opens on hover with zero delay", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.hover(screen.getByText("trigger"))
    expect(await screen.findByText("card content")).toBeInTheDocument()
  })

  it("closes on pointer leave", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByText("trigger")
    await user.hover(trigger)
    await screen.findByText("card content")
    await user.unhover(trigger)
    await waitFor(() => expect(screen.queryByText("card content")).toBeNull())
  })

  it("opens on focus", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.tab()
    expect(await screen.findByText("card content")).toBeInTheDocument()
  })

  it("Escape closes", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.tab()
    await screen.findByText("card content")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByText("card content")).toBeNull())
  })

  // The card is a layer above the dialog it sits in: one Escape closes the
  // card alone, and only the next one reaches the dialog.
  it("Escape inside a dialog closes the card and not the dialog", async () => {
    const user = userEvent.setup()
    const onDialogOpenChange = vi.fn()
    render(<HoverCardInDialog onDialogOpenChange={onDialogOpenChange} />)
    await user.hover(screen.getByText("trigger"))
    await screen.findByText("card content")

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByText("card content")).toBeNull())
    expect(onDialogOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(onDialogOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it("Escape reaches the dialog when no card is open", async () => {
    const user = userEvent.setup()
    const onDialogOpenChange = vi.fn()
    render(<HoverCardInDialog onDialogOpenChange={onDialogOpenChange} />)
    expect(screen.queryByText("card content")).toBeNull()

    await user.keyboard("{Escape}")
    expect(onDialogOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it("trigger and content data-state align", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByText("trigger")
    expect(trigger).toHaveAttribute("data-state", "closed")
    await user.hover(trigger)
    const content = await screen.findByText("card content")
    expect(trigger).toHaveAttribute("data-state", "open")
    expect(content).toHaveAttribute("data-state", "open")
  })

  it("hovering content cancels close (interactive content)", async () => {
    const user = userEvent.setup()
    render(<Basic openDelay={0} closeDelay={50} />)
    const trigger = screen.getByText("trigger")
    await user.hover(trigger)
    const content = await screen.findByText("card content")
    await user.unhover(trigger)
    await user.hover(content)
    // cancelSchedule should keep content visible
    await new Promise((r) => setTimeout(r, 80))
    expect(screen.getByText("card content")).toBeInTheDocument()
  })

  it("controlled open via prop", () => {
    render(
      <HoverCard open onOpenChange={() => {}}>
        <HoverCardTrigger href="#">a</HoverCardTrigger>
        <HoverCardContent>controlled</HoverCardContent>
      </HoverCard>,
    )
    expect(screen.getByText("controlled")).toBeInTheDocument()
  })

  it("forwards surfaceIntensity to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger href="#">trigger</HoverCardTrigger>
        <HoverCardContent surfaceIntensity="flat">
          card content
        </HoverCardContent>
      </HoverCard>,
    )
    await user.hover(screen.getByText("trigger"))
    expect(await screen.findByRole("dialog")).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger href="#">trigger</HoverCardTrigger>
        <HoverCardContent surfaceIntensity="balanced">
          card content
        </HoverCardContent>
      </HoverCard>,
    )
    await user.hover(screen.getByText("trigger"))
    expect(await screen.findByRole("dialog")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })
})
