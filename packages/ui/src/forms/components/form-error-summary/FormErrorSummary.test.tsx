import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { useState } from "react"

import { FormErrorSummary } from "@forms/components/form-error-summary"

const ERRORS = [
  { name: "email", message: "Enter an email address" },
  { name: "password", message: "Password must be at least 8 characters" },
]

describe("FormErrorSummary", () => {
  it("renders nothing when the form is valid", () => {
    const { container } = render(<FormErrorSummary errors={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("takes focus so the user lands on what went wrong", () => {
    render(<FormErrorSummary errors={ERRORS} />)
    expect(document.activeElement).toBe(screen.getByRole("alert"))
  })

  it("stays out of the tab order, being a destination rather than a stop", () => {
    render(<FormErrorSummary errors={ERRORS} />)
    expect(screen.getByRole("alert")).toHaveAttribute("tabindex", "-1")
  })

  it("lists every error, linked to its field", () => {
    render(<FormErrorSummary errors={ERRORS} />)
    expect(
      screen.getByRole("link", { name: "Enter an email address" }),
    ).toHaveAttribute("href", "#email")
    expect(
      screen.getByRole("link", { name: /at least 8 characters/ }),
    ).toHaveAttribute("href", "#password")
  })

  it("moves focus to the field when an entry is followed", async () => {
    const user = userEvent.setup()
    render(
      <>
        <FormErrorSummary errors={ERRORS} />
        <input id="password" />
      </>,
    )
    await user.click(
      screen.getByRole("link", { name: /at least 8 characters/ }),
    )
    expect(document.activeElement).toBe(document.getElementById("password"))
  })

  it("re-focuses on a repeat submit with the same errors", async () => {
    const user = userEvent.setup()
    function Harness() {
      const [count, setCount] = useState(1)
      return (
        <>
          <FormErrorSummary errors={ERRORS} submitCount={count} />
          <button onClick={() => setCount((c) => c + 1)}>Submit again</button>
        </>
      )
    }
    render(<Harness />)
    const button = screen.getByRole("button", { name: "Submit again" })
    button.focus()
    expect(document.activeElement).toBe(button)

    await user.click(button)
    // Without submitCount in the effect deps the error list is unchanged, the
    // effect never re-runs, and focus stays on the button — a second failed
    // submit would then say nothing at all.
    expect(document.activeElement).toBe(screen.getByRole("alert"))
  })

  it("gives each summary its own heading id", () => {
    render(
      <>
        <FormErrorSummary errors={ERRORS} title="First form" />
        <FormErrorSummary errors={ERRORS} title="Second form" />
      </>,
    )
    const [first, second] = screen.getAllByRole("alert")
    expect(first.getAttribute("aria-labelledby")).not.toBe(
      second.getAttribute("aria-labelledby"),
    )
  })
})
