import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { createRef, useState } from "react"
import { Input, type InputProps } from "@components/input"

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

  describe("slots", () => {
    const SLOTS = [
      "prefix",
      "suffix",
      "leadingAction",
      "trailingAction",
    ] as const

    function ClearableInput() {
      const [value, setValue] = useState("")
      return (
        <Input
          aria-label="Search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          trailingAction={
            value ? (
              <button type="button" onClick={() => setValue("")}>
                Clear
              </button>
            ) : null
          }
        />
      )
    }

    it("keeps focus while typing toggles trailingAction", async () => {
      const user = userEvent.setup()
      render(<ClearableInput />)
      const input = screen.getByRole("textbox", { name: "Search" })
      await user.type(input, "hello")
      expect(screen.getByRole("textbox", { name: "Search" })).toBe(input)
      expect(input).toHaveFocus()
      expect(input).toHaveValue("hello")
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument()
    })

    it.each(SLOTS)(
      "keeps the input node, focus and selection when %s toggles",
      (slot) => {
        const props = (content: InputProps[typeof slot]): InputProps => ({
          "aria-label": "Amount",
          defaultValue: "hello",
          [slot]: content,
        })
        const { rerender } = render(<Input {...props(null)} />)
        const input = screen.getByRole<HTMLInputElement>("textbox", {
          name: "Amount",
        })
        input.focus()
        input.setSelectionRange(1, 3)

        rerender(<Input {...props(<span>slot</span>)} />)
        expect(screen.getByRole("textbox", { name: "Amount" })).toBe(input)
        expect(input).toHaveFocus()
        expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3])

        rerender(<Input {...props(null)} />)
        expect(screen.getByRole("textbox", { name: "Amount" })).toBe(input)
        expect(input).toHaveFocus()
      },
    )

    it.each([null, false])(
      "renders the group without a slot span for %s",
      (content) => {
        const { container } = render(
          <Input aria-label="Amount" trailingAction={content} />,
        )
        expect(container.querySelector(".dr-input-group")).not.toBeNull()
        expect(container.querySelector(".dr-input-action")).toBeNull()
      },
    )

    it("renders a bare input when no slot attribute is passed", () => {
      const { container } = render(<Input aria-label="Amount" />)
      expect(container.firstElementChild).toBe(
        screen.getByRole("textbox", { name: "Amount" }),
      )
    })

    it.each(SLOTS)("renders a bare input when %s is undefined", (slot) => {
      const { container } = render(
        <Input aria-label="Amount" {...{ [slot]: undefined }} />,
      )
      const input = screen.getByRole("textbox", { name: "Amount" })
      expect(container.firstElementChild).toBe(input)
      expect(input).not.toHaveClass("dr-input-grouped")
    })
  })
})
