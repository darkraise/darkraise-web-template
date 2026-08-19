import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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

// The trigger only raises a tooltip for KEYBOARD focus, so these tests have
// to say which modality they mean. jsdom tracks input modality globally per
// window and never resets it between tests in a file, so a single
// `user.hover` earlier in the file leaves `:focus-visible` false for every
// later `user.tab()`. Firing the Tab keydown ourselves before moving focus
// states the intent directly instead of depending on that leaked state.
async function keyboardFocus(element: HTMLElement): Promise<void> {
  fireEvent.keyDown(document, { key: "Tab" })
  element.focus()
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

  it("opens on keyboard focus", async () => {
    render(<Basic delayDuration={0} />)
    await keyboardFocus(screen.getByRole("button", { name: "Hover me" }))
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
    render(<Basic delayDuration={0} />)
    const trigger = screen.getByRole("button", { name: "Hover me" })
    await keyboardFocus(trigger)
    await screen.findByRole("tooltip")
    trigger.blur()
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
    await keyboardFocus(screen.getByRole("button", { name: "Hover me" }))
    await screen.findByRole("tooltip")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
  })

  // A tooltip opened by focus can never be dismissed by `pointerleave`,
  // because the pointer never entered the trigger. So focus that did not come
  // from the keyboard must not open one at all, or it strands an open tooltip
  // the user cannot get rid of by moving the mouse.
  it("does not reopen when the trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<Basic delayDuration={0} />)
    const trigger = screen.getByRole("button", { name: "Hover me" })

    await user.hover(trigger)
    await screen.findByRole("tooltip")

    // pointerdown closes it; the focus the click leaves behind used to
    // reopen it immediately via the provider's skip-delay window.
    await user.click(trigger)
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
    expect(screen.queryByRole("tooltip")).toBeNull()
  })

  it("stays closed when focus is restored after a pointer interaction", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Basic delayDuration={0} />
        <button type="button">Elsewhere</button>
      </>,
    )
    const trigger = screen.getByRole("button", { name: "Hover me" })

    // Clicking the trigger is what opens a modal in practice.
    await user.click(trigger)
    // The modal traps focus...
    screen.getByRole("button", { name: "Elsewhere" }).focus()
    // ...and hands it back to the trigger on close (useFocusTrap
    // restoreFocus). That programmatic focus must not raise a tooltip with
    // the pointer nowhere near the trigger.
    trigger.focus()

    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole("tooltip")).toBeNull()
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

  it("forwards surfaceIntensity to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent surfaceIntensity="flat">Tip text</TooltipContent>
      </Tooltip>,
    )
    await user.hover(screen.getByRole("button", { name: "Hover me" }))
    expect(await screen.findByRole("tooltip")).toHaveAttribute(
      "data-surface-intensity",
      "flat",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent surfaceIntensity="balanced">Tip text</TooltipContent>
      </Tooltip>,
    )
    await user.hover(screen.getByRole("button", { name: "Hover me" }))
    expect(await screen.findByRole("tooltip")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })
})
