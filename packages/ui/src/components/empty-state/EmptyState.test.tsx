import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { EmptyState } from "./EmptyState"

describe("EmptyState", () => {
  it("renders the title and description as headings/paragraphs", () => {
    render(
      <EmptyState
        title="No results"
        description="Try a different search term."
      />,
    )
    expect(
      screen.getByRole("heading", { name: "No results" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Try a different search term.")).toBeInTheDocument()
  })

  it("renders an action when provided", () => {
    render(
      <EmptyState
        title="No items"
        action={<button type="button">Create one</button>}
      />,
    )
    expect(
      screen.getByRole("button", { name: "Create one" }),
    ).toBeInTheDocument()
  })

  it("renders an icon slot", () => {
    render(<EmptyState icon={<span data-testid="x" />} title="x" />)
    expect(screen.getByTestId("x")).toBeInTheDocument()
  })
})
