import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import * as React from "react"
import { Swap, SwapIndicator } from "./Swap"

describe("Swap", () => {
  it("marks the on indicator as active when pressed=true", () => {
    render(
      <Swap pressed>
        <SwapIndicator state="on" data-testid="on">
          on-content
        </SwapIndicator>
        <SwapIndicator state="off" data-testid="off">
          off-content
        </SwapIndicator>
      </Swap>,
    )
    expect(screen.getByTestId("on")).toHaveAttribute("data-active", "true")
    expect(screen.getByTestId("off")).toHaveAttribute("data-active", "false")
    expect(screen.getByText("on-content")).toBeInTheDocument()
    expect(screen.getByText("off-content")).toBeInTheDocument()
  })

  it("marks the off indicator as active when pressed=false", () => {
    render(
      <Swap pressed={false}>
        <SwapIndicator state="on" data-testid="on">
          on
        </SwapIndicator>
        <SwapIndicator state="off" data-testid="off">
          off
        </SwapIndicator>
      </Swap>,
    )
    expect(screen.getByTestId("on")).toHaveAttribute("data-active", "false")
    expect(screen.getByTestId("off")).toHaveAttribute("data-active", "true")
  })

  it("updates active indicator when pressed prop changes", () => {
    const { rerender } = render(
      <Swap pressed={false}>
        <SwapIndicator state="on" data-testid="on">
          on
        </SwapIndicator>
        <SwapIndicator state="off" data-testid="off">
          off
        </SwapIndicator>
      </Swap>,
    )
    expect(screen.getByTestId("off")).toHaveAttribute("data-active", "true")

    rerender(
      <Swap pressed={true}>
        <SwapIndicator state="on" data-testid="on">
          on
        </SwapIndicator>
        <SwapIndicator state="off" data-testid="off">
          off
        </SwapIndicator>
      </Swap>,
    )
    expect(screen.getByTestId("on")).toHaveAttribute("data-active", "true")
    expect(screen.getByTestId("off")).toHaveAttribute("data-active", "false")
  })

  it("uses defaultPressed when uncontrolled with no parent re-renders", () => {
    const renderSpy = vi.fn()
    function Parent() {
      renderSpy()
      return (
        <Swap defaultPressed>
          <SwapIndicator state="on" data-testid="on">
            on
          </SwapIndicator>
          <SwapIndicator state="off" data-testid="off">
            off
          </SwapIndicator>
        </Swap>
      )
    }
    render(<Parent />)
    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("on")).toHaveAttribute("data-active", "true")
    expect(screen.getByTestId("off")).toHaveAttribute("data-active", "false")
  })

  it("emits data-pressed on the root and renders both indicators in DOM", () => {
    const { container } = render(
      <Swap pressed>
        <SwapIndicator state="on">on</SwapIndicator>
        <SwapIndicator state="off">off</SwapIndicator>
      </Swap>,
    )
    const root = container.querySelector(".dr-swap")
    expect(root).toHaveAttribute("data-pressed", "true")
    expect(container.querySelectorAll(".dr-swap-indicator")).toHaveLength(2)
  })

  it("throws if SwapIndicator is rendered outside Swap", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() =>
      render(<SwapIndicator state="on">orphan</SwapIndicator>),
    ).toThrow(/<SwapIndicator> must be used within a <Swap>/)
    errorSpy.mockRestore()
  })

  it("does not echo controlled pressed changes back through onPressedChange", () => {
    // Swap is presentational and has no internal trigger, so controlled
    // callers should not receive a callback simply because they updated
    // the prop themselves.
    const onPressedChange = vi.fn()
    const { rerender } = render(
      <Swap pressed={false} onPressedChange={onPressedChange}>
        <SwapIndicator state="on">on</SwapIndicator>
        <SwapIndicator state="off">off</SwapIndicator>
      </Swap>,
    )
    expect(onPressedChange).not.toHaveBeenCalled()
    rerender(
      <Swap pressed={true} onPressedChange={onPressedChange}>
        <SwapIndicator state="on">on</SwapIndicator>
        <SwapIndicator state="off">off</SwapIndicator>
      </Swap>,
    )
    expect(onPressedChange).not.toHaveBeenCalled()
  })
})
