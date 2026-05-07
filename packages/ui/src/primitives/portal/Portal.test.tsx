import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Portal } from "./Portal"

describe("Portal", () => {
  it("mounts children in document.body by default", () => {
    render(
      <Portal>
        <div data-testid="x">hi</div>
      </Portal>,
    )
    const node = screen.getByTestId("x")
    expect(node.parentElement).toBe(document.body)
  })

  it("mounts children into a custom container when provided", () => {
    const container = document.createElement("section")
    document.body.append(container)
    render(
      <Portal container={container}>
        <div data-testid="x">hi</div>
      </Portal>,
    )
    expect(screen.getByTestId("x").parentElement).toBe(container)
    container.remove()
  })
})
