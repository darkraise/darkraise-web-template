import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FocusTrap } from "./FocusTrap"

describe("FocusTrap", () => {
  it("renders its children inside a div by default", () => {
    render(
      <FocusTrap>
        <button data-testid="x">x</button>
      </FocusTrap>,
    )
    const node = screen.getByTestId("x")
    expect(node.tagName).toBe("BUTTON")
    expect(node.parentElement?.tagName).toBe("DIV")
  })

  it("focuses the first tabbable on mount", () => {
    render(
      <FocusTrap>
        <button data-testid="x">x</button>
      </FocusTrap>,
    )
    expect(document.activeElement).toBe(screen.getByTestId("x"))
  })

  it("restores focus to previous activeElement on unmount", () => {
    const opener = document.createElement("button")
    opener.textContent = "opener"
    document.body.append(opener)
    opener.focus()

    const Wrap = ({ open }: { open: boolean }) =>
      open ? (
        <FocusTrap>
          <button data-testid="x">x</button>
        </FocusTrap>
      ) : null

    const { rerender } = render(<Wrap open />)
    expect(document.activeElement).toBe(screen.getByTestId("x"))
    rerender(<Wrap open={false} />)
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
