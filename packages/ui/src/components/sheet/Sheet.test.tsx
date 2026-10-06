import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Sheet, SheetBody, SheetContent } from "@components/sheet"

describe("Sheet", () => {
  it("forwards surface to the content surface", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent surface="page">Body</SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-surface-fill",
      "page",
    )
  })

  it("emits the attribute for card, so it overrides an ancestor", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent surface="card">Body</SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-surface-fill",
      "card",
    )
  })

  it("renders a body part", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetBody>Rows</SheetBody>
        </SheetContent>
      </Sheet>,
    )
    expect(screen.getByText("Rows")).toHaveClass("dr-sheet-body")
  })

  it("sits at the inline end by default", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>Body</SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "end")
  })
})
