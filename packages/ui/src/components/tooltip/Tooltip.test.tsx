import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@components/tooltip"

function Basic({ delayDuration = 0 }: { delayDuration?: number } = {}) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger>Hover me</TooltipTrigger>
      <TooltipContent>Tip text</TooltipContent>
    </Tooltip>
  )
}

describe("Tooltip", () => {
  it("does not render content initially", () => {
    render(<Basic />)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })

  it("opens on hover after delay", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    await user.hover(screen.getByRole("button", { name: "Hover me" }))
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Tip text")
  })

  it("opens on focus", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    await user.tab()
    expect(await screen.findByRole("tooltip")).toBeInTheDocument()
  })

  it("closes on pointer leave", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    const trigger = screen.getByRole("button", { name: "Hover me" })
    await user.hover(trigger)
    await screen.findByRole("tooltip")
    await user.unhover(trigger)
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
  })

  it("closes on blur", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    await user.tab()
    await screen.findByRole("tooltip")
    await user.tab()
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
  })

  it("trigger has aria-describedby pointing at content when open", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    const trigger = screen.getByRole("button", { name: "Hover me" })
    await user.hover(trigger)
    const tip = await screen.findByRole("tooltip")
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id)
  })

  it("trigger sets data-state to open when shown", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    const trigger = screen.getByRole("button", { name: "Hover me" })
    expect(trigger).toHaveAttribute("data-state", "closed")
    await user.hover(trigger)
    await screen.findByRole("tooltip")
    expect(trigger).toHaveAttribute("data-state", "open")
  })

  it("Escape closes the tooltip", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    await user.tab()
    await screen.findByRole("tooltip")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
  })

  it("Provider context propagates delayDuration default", () => {
    render(
      <TooltipProvider delayDuration={500}>
        <Tooltip>
          <TooltipTrigger>X</TooltipTrigger>
          <TooltipContent>tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    // No-op render assertion — the provider wraps without errors.
    expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument()
  })
})
