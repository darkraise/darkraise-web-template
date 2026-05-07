import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Presence } from "./Presence"

describe("Presence", () => {
  it("renders the child when present is true", () => {
    render(
      <Presence present>
        <div data-testid="x">hi</div>
      </Presence>,
    )
    expect(screen.getByTestId("x")).toBeInTheDocument()
  })

  it("emits data-state='open' on the child when present", () => {
    render(
      <Presence present>
        <div data-testid="x">hi</div>
      </Presence>,
    )
    expect(screen.getByTestId("x").getAttribute("data-state")).toBe("open")
  })

  it("forceMount keeps the child mounted even when present is false", () => {
    render(
      <Presence present={false} forceMount>
        <div data-testid="x">hi</div>
      </Presence>,
    )
    expect(screen.getByTestId("x")).toBeInTheDocument()
    expect(screen.getByTestId("x").getAttribute("data-state")).toBe("closed")
  })
})
