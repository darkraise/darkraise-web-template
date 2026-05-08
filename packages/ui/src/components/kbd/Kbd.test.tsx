import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Kbd } from "./Kbd"

describe("Kbd", () => {
  it("renders a kbd element with the provided shortcut", () => {
    render(<Kbd>⌘K</Kbd>)
    const node = screen.getByText("⌘K")
    expect(node.tagName).toBe("KBD")
  })

  it("applies size data attribute", () => {
    render(
      <Kbd size="lg" data-testid="k">
        Esc
      </Kbd>,
    )
    expect(screen.getByTestId("k")).toHaveAttribute("data-size", "lg")
  })
})
