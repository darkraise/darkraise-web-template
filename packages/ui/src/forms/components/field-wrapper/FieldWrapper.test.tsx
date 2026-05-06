import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { FieldWrapper } from "@forms/components/field-wrapper"

describe("FieldWrapper", () => {
  it("renders the label bound to the input id via name", () => {
    render(
      <FieldWrapper name="email" label="Email address">
        {() => <input id="email" />}
      </FieldWrapper>,
    )
    const label = screen.getByText("Email address")
    expect(label).toHaveAttribute("for", "email")
  })

  it("calls children with isInvalid=false when no error state is provided", () => {
    const renderSpy = vi.fn(() => <input />)
    render(
      <FieldWrapper name="x" label="X">
        {renderSpy}
      </FieldWrapper>,
    )
    expect(renderSpy).toHaveBeenCalledWith(false)
  })

  it("renders description when provided", () => {
    render(
      <FieldWrapper name="x" label="X" description="Helpful hint">
        {() => <input />}
      </FieldWrapper>,
    )
    expect(screen.getByText("Helpful hint")).toBeInTheDocument()
  })

  it("renders error messages when isInvalid is true", () => {
    render(
      <FieldWrapper
        name="x"
        label="X"
        isInvalid
        errors={[{ message: "This field is required" }]}
      >
        {(isInvalid) => <input aria-invalid={isInvalid} />}
      </FieldWrapper>,
    )
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("does not render errors when isInvalid is false even if errors are supplied", () => {
    render(
      <FieldWrapper
        name="x"
        label="X"
        isInvalid={false}
        errors={[{ message: "Stale error" }]}
      >
        {() => <input />}
      </FieldWrapper>,
    )
    expect(screen.queryByText("Stale error")).not.toBeInTheDocument()
  })
})
