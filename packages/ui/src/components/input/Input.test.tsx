import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import { Input } from "@components/input"

describe("Input", () => {
  it("renders with placeholder text", () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument()
  })

  it("accepts typed input", async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    const input = screen.getByPlaceholderText("Type here")
    await user.type(input, "hello")
    expect(input).toHaveValue("hello")
  })

  it("is disabled when disabled prop is set", () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled()
  })

  it("does not accept input when disabled", async () => {
    const user = userEvent.setup()
    render(<Input disabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText("Disabled")
    await user.type(input, "hello")
    expect(input).toHaveValue("")
  })

  it("forwards ref to the input element", () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Ref input" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it("applies custom className", () => {
    render(<Input className="custom-class" placeholder="Styled" />)
    expect(screen.getByPlaceholderText("Styled")).toHaveClass("custom-class")
  })

  it("renders with the correct input type", () => {
    render(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    )
  })
})
