import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { createRef, useState } from "react"
import { Toggle } from "@components/toggle"

describe("Toggle", () => {
  it("renders a button with aria-pressed=false by default", () => {
    render(<Toggle>B</Toggle>)
    const btn = screen.getByRole("button")
    expect(btn).toHaveAttribute("aria-pressed", "false")
    expect(btn).toHaveAttribute("data-state", "off")
  })

  it("toggles uncontrolled on click", async () => {
    const user = userEvent.setup()
    render(<Toggle>B</Toggle>)
    const btn = screen.getByRole("button")
    await user.click(btn)
    expect(btn).toHaveAttribute("aria-pressed", "true")
    expect(btn).toHaveAttribute("data-state", "on")
  })

  it("respects defaultPressed", () => {
    render(<Toggle defaultPressed>B</Toggle>)
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true")
  })

  it("calls onPressedChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle onPressedChange={onChange}>B</Toggle>)
    await user.click(screen.getByRole("button"))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("supports controlled pressed", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState(false)
      return (
        <Toggle pressed={v} onPressedChange={setV}>
          B
        </Toggle>
      )
    }
    render(<Controlled />)
    const btn = screen.getByRole("button")
    await user.click(btn)
    expect(btn).toHaveAttribute("aria-pressed", "true")
  })

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Toggle disabled onPressedChange={onChange}>
        B
      </Toggle>,
    )
    await user.click(screen.getByRole("button"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("forwards ref", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Toggle ref={ref}>B</Toggle>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("emits data-variant and data-size", () => {
    render(
      <Toggle variant="outline" size="lg">
        B
      </Toggle>,
    )
    const btn = screen.getByRole("button")
    expect(btn).toHaveAttribute("data-variant", "outline")
    expect(btn).toHaveAttribute("data-size", "lg")
  })
})
