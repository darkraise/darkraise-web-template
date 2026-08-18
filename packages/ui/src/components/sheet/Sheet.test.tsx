import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Sheet, SheetContent } from "@components/sheet"

describe("Sheet", () => {
  it("forwards surfaceIntensity to the content surface", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent surfaceIntensity="bold">Body</SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-surface-intensity",
      "bold",
    )
  })

  it("emits the attribute for balanced, so it overrides an ancestor", () => {
    render(
      <Sheet defaultOpen>
        <SheetContent surfaceIntensity="balanced">Body</SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-surface-intensity",
      "balanced",
    )
  })
})
