import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Toolbar, ToolbarSeparator } from "./Toolbar"

describe("Toolbar", () => {
  it("renders with role='toolbar'", () => {
    render(
      <Toolbar aria-label="Editing">
        <button>Bold</button>
        <ToolbarSeparator />
        <button>Italic</button>
      </Toolbar>,
    )
    expect(screen.getByRole("toolbar", { name: "Editing" })).toBeInTheDocument()
    expect(screen.getByRole("separator")).toBeInTheDocument()
  })

  it("supports vertical orientation on root and separator", () => {
    render(
      <Toolbar orientation="vertical" aria-label="Vertical" data-testid="bar">
        <button>One</button>
        <ToolbarSeparator orientation="horizontal" data-testid="sep" />
        <button>Two</button>
      </Toolbar>,
    )
    const bar = screen.getByTestId("bar")
    expect(bar).toHaveAttribute("aria-orientation", "vertical")
    expect(bar).toHaveAttribute("data-orientation", "vertical")
    const sep = screen.getByTestId("sep")
    expect(sep).toHaveAttribute("aria-orientation", "horizontal")
    expect(sep).toHaveAttribute("data-orientation", "horizontal")
  })
})
