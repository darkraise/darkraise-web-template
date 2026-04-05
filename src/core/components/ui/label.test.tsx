import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import { Label } from "./label"

describe("Label", () => {
  it("renders with text content", () => {
    render(<Label>Email address</Label>)
    expect(screen.getByText("Email address")).toBeInTheDocument()
  })

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" type="email" />
      </>,
    )
    const label = screen.getByText("Email")
    expect(label).toHaveAttribute("for", "email-input")
  })

  it("clicking the label focuses the associated input", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="name-input">Name</Label>
        <input id="name-input" />
      </>,
    )
    await user.click(screen.getByText("Name"))
    expect(screen.getByRole("textbox")).toHaveFocus()
  })

  it("forwards ref to the label element", () => {
    const ref = createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Label text</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it("applies custom className", () => {
    render(<Label className="custom-label">Styled</Label>)
    expect(screen.getByText("Styled")).toHaveClass("custom-label")
  })

  it("renders as a label element", () => {
    render(<Label>My Label</Label>)
    expect(screen.getByText("My Label").tagName).toBe("LABEL")
  })
})
