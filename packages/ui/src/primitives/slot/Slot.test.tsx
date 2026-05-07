import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { Slot } from "./Slot"

describe("Slot", () => {
  it("renders the child element with merged className", () => {
    render(
      <Slot className="parent-class">
        <button className="child-class" data-testid="x">
          click
        </button>
      </Slot>,
    )
    const node = screen.getByTestId("x")
    expect(node.className).toContain("parent-class")
    expect(node.className).toContain("child-class")
  })

  it("forwards a parent ref onto the child element", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <Slot ref={ref}>
        <button>x</button>
      </Slot>,
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("BUTTON")
  })

  it("merges event handlers — parent runs first; child runs when parent does not preventDefault", async () => {
    const parent = vi.fn()
    const child = vi.fn()
    render(
      <Slot onClick={parent}>
        <button onClick={child}>x</button>
      </Slot>,
    )
    await userEvent.click(screen.getByText("x"))
    expect(parent).toHaveBeenCalledTimes(1)
    expect(child).toHaveBeenCalledTimes(1)
  })

  it("child handler is skipped when parent calls event.preventDefault()", async () => {
    const parent = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const child = vi.fn()
    render(
      <Slot onClick={parent}>
        <button onClick={child}>x</button>
      </Slot>,
    )
    await userEvent.click(screen.getByText("x"))
    expect(parent).toHaveBeenCalledTimes(1)
    expect(child).toHaveBeenCalledTimes(0)
  })

  it("merges style with child wins on conflicting keys", () => {
    render(
      <Slot style={{ color: "red", margin: 4 }}>
        <button style={{ color: "blue" }} data-testid="y">
          x
        </button>
      </Slot>,
    )
    const node = screen.getByTestId("y") as HTMLButtonElement
    expect(node.style.color).toBe("blue")
    expect(node.style.margin).toBe("4px")
  })

  it("throws if children is not a single element", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(
        <Slot>
          <span>a</span>
          <span>b</span>
        </Slot>,
      ),
    ).toThrow()
    spy.mockRestore()
  })
})
