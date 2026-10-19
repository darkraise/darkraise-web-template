import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { useState } from "react"
import { Textarea } from "@components/textarea"

function ClearableTextarea() {
  const [value, setValue] = useState("")
  return (
    <Textarea
      aria-label="Notes"
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

describe("Textarea", () => {
  it("keeps focus while typing toggles trailingAction", async () => {
    const user = userEvent.setup()
    render(<ClearableTextarea />)
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    await user.type(textarea, "hello")
    expect(screen.getByRole("textbox", { name: "Notes" })).toBe(textarea)
    expect(textarea).toHaveFocus()
    expect(textarea).toHaveValue("hello")
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument()
  })

  it("keeps the textarea node, focus and selection when trailingAction toggles", () => {
    const { rerender } = render(
      <Textarea
        aria-label="Notes"
        defaultValue="hello"
        trailingAction={null}
      />,
    )
    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Notes",
    })
    textarea.focus()
    textarea.setSelectionRange(1, 3)

    rerender(
      <Textarea
        aria-label="Notes"
        defaultValue="hello"
        trailingAction={<span>action</span>}
      />,
    )
    expect(screen.getByRole("textbox", { name: "Notes" })).toBe(textarea)
    expect(textarea).toHaveFocus()
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([1, 3])

    rerender(
      <Textarea
        aria-label="Notes"
        defaultValue="hello"
        trailingAction={null}
      />,
    )
    expect(screen.getByRole("textbox", { name: "Notes" })).toBe(textarea)
    expect(textarea).toHaveFocus()
  })

  it.each([null, false])(
    "renders the group without an action span for %s",
    (content) => {
      const { container } = render(
        <Textarea aria-label="Notes" trailingAction={content} />,
      )
      expect(container.querySelector(".dr-textarea-group")).not.toBeNull()
      expect(container.querySelector(".dr-textarea-action")).toBeNull()
    },
  )

  it("renders a bare textarea when trailingAction is not passed", () => {
    const { container } = render(
      <Textarea aria-label="Notes" className="custom" />,
    )
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    expect(container.firstElementChild).toBe(textarea)
    expect(textarea).toHaveClass("dr-textarea", "custom")
    expect(textarea).not.toHaveClass("dr-textarea-grouped")
  })

  it("renders a bare textarea when trailingAction is undefined", () => {
    const { container } = render(
      <Textarea aria-label="Notes" trailingAction={undefined} />,
    )
    const textarea = screen.getByRole("textbox", { name: "Notes" })
    expect(container.firstElementChild).toBe(textarea)
    expect(textarea).not.toHaveClass("dr-textarea-grouped")
  })
})
