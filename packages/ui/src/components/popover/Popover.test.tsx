import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { isProgrammaticFocus } from "@primitives/focus-trap"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
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
    await waitFor(() =>
      expect(screen.queryByText("Popover content")).toBeNull(),
    )
  })

  it("PopoverClose closes the popover", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    await screen.findByText("Popover content")
    await user.click(screen.getByRole("button", { name: "Close" }))
    await waitFor(() =>
      expect(screen.queryByText("Popover content")).toBeNull(),
    )
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
    await waitFor(() =>
      expect(screen.queryByText("Popover content")).toBeNull(),
    )
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
  it("non-modal: returns focus to the trigger on close", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Toggle" })
    await user.click(trigger)
    await screen.findByText("Popover content")
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByText("Popover content")).toBeNull()
    })
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it("non-modal: onCloseAutoFocus preventDefault opts out of the restore", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <p>Popover content</p>
        </PopoverContent>
      </Popover>,
    )
    const trigger = screen.getByRole("button", { name: "Toggle" })
    await user.click(trigger)
    await screen.findByText("Popover content")
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByText("Popover content")).toBeNull()
    })
    expect(document.activeElement).not.toBe(trigger)
  })

  it("forwards surface to the content surface", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent surface="page">
          <p>Popover content</p>
        </PopoverContent>
      </Popover>,
    )
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    const content = await screen.findByText("Popover content")
    expect(content.parentElement).toHaveAttribute("data-surface-fill", "page")
  })

  it("emits the attribute for card, so it overrides an ancestor", async () => {
    const user = userEvent.setup()
    render(
      <Popover>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent surface="card">
          <p>Popover content</p>
        </PopoverContent>
      </Popover>,
    )
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    const content = await screen.findByText("Popover content")
    expect(content.parentElement).toHaveAttribute("data-surface-fill", "card")
  })

  it("marks the focus it returns to the trigger as programmatic", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole("button", { name: "Toggle" })
    await user.click(trigger)
    await screen.findByText("Popover content")
    const marks: boolean[] = []
    trigger.addEventListener("focus", () => marks.push(isProgrammaticFocus()))

    await user.keyboard("{Escape}")
    await waitFor(() => expect(document.activeElement).toBe(trigger))

    expect(marks).toEqual([true])
  })
})

describe("Popover logical sides", () => {
  it.each([
    ["ltr", "right"],
    ["rtl", "left"],
  ] as const)(
    'resolves side="end" under %s to data-side %s',
    async (dir, physical) => {
      render(
        <div dir={dir}>
          <Popover defaultOpen>
            <PopoverTrigger>Toggle</PopoverTrigger>
            <PopoverContent side="end" avoidCollisions={false}>
              Side content
            </PopoverContent>
          </Popover>
        </div>,
      )
      const content = await screen.findByText("Side content")
      await waitFor(() =>
        expect(content.closest("[data-side]")).toHaveAttribute(
          "data-side",
          physical,
        ),
      )
    },
  )
})

describe("Popover direction", () => {
  it("gives the content its trigger's direction", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <Basic />
      </div>,
    )
    await user.click(screen.getByRole("button", { name: "Toggle" }))
    const content = await screen.findByText("Popover content")
    expect(content.closest(".dr-popover-content")).toHaveAttribute("dir", "rtl")
  })

  it("lets a dir on the content override its trigger's direction", async () => {
    render(
      <div dir="rtl">
        <Popover defaultOpen>
          <PopoverTrigger>Toggle</PopoverTrigger>
          <PopoverContent dir="ltr">Left to right</PopoverContent>
        </Popover>
      </div>,
    )
    const content = await screen.findByText("Left to right")
    expect(content.closest(".dr-popover-content")).toHaveAttribute("dir", "ltr")
  })
})

describe("PopoverArrow", () => {
  it("keeps its position under a consumer style", async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent>
          Arrow content
          <PopoverArrow data-testid="arrow" style={{ color: "red" }} />
        </PopoverContent>
      </Popover>,
    )
    const arrow = await screen.findByTestId("arrow")
    expect(arrow.style.color).toBe("red")
    expect(arrow.style.position).toBe("absolute")
    await waitFor(() => expect(arrow.style.left).toMatch(/^-?\d+(\.\d+)?px$/))
  })
})
