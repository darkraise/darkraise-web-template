import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@components/hover-card"

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
})
