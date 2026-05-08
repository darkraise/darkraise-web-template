import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Spinner } from "./Spinner"

describe("Spinner", () => {
  it("renders with role='status'", () => {
    render(<Spinner />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("uses provided aria-label as accessible name", () => {
    render(<Spinner aria-label="Loading messages" />)
    expect(
      screen.getByRole("status", { name: "Loading messages" }),
    ).toBeInTheDocument()
  })

  it("renders a default sr-only label when none is provided", () => {
    render(<Spinner />)
    expect(screen.getByText("Loading")).toHaveClass("sr-only")
  })

  it("applies size data attribute", () => {
    render(<Spinner size="lg" data-testid="s" />)
    expect(screen.getByTestId("s")).toHaveAttribute("data-size", "lg")
  })

  it("applies variant data attribute", () => {
    render(<Spinner variant="primary" data-testid="s" />)
    expect(screen.getByTestId("s")).toHaveAttribute("data-variant", "primary")
  })
})
