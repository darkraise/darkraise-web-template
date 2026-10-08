import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ShowcaseExample } from "./-showcase-example"

describe("ShowcaseExample", () => {
  it("marks its wrapper and its preview card with the showcase hooks", () => {
    const { container } = render(
      <ShowcaseExample title="Sample" code="<Sample />">
        <span>sample demo</span>
      </ShowcaseExample>,
    )
    const example = container.firstElementChild
    expect(example).toHaveAttribute("data-showcase-example", "")
    const preview = screen.getByText("sample demo").parentElement
    expect(preview).toHaveAttribute("data-showcase-preview", "")
    expect(preview).toHaveClass("dr-card")
    expect(example?.querySelectorAll("[data-showcase-preview]")).toHaveLength(1)
  })
})
