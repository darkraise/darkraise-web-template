import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DismissableLayer } from "./DismissableLayer"

describe("DismissableLayer", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it("calls onEscapeKeyDown when Escape is pressed", async () => {
    const onEscape = vi.fn()
    render(
      <DismissableLayer onEscapeKeyDown={onEscape}>
        <div data-testid="x">x</div>
      </DismissableLayer>,
    )
    await userEvent.keyboard("{Escape}")
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it("calls onPointerDownOutside on outside pointerdown", async () => {
    const onOutside = vi.fn()
    render(
      <>
        <button data-testid="outside">o</button>
        <DismissableLayer onPointerDownOutside={onOutside}>
          <div data-testid="inside">x</div>
        </DismissableLayer>
      </>,
    )
    await userEvent.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByTestId("outside"),
    })
    expect(onOutside).toHaveBeenCalledTimes(1)
  })

  it("does NOT call onPointerDownOutside on inside pointerdown", async () => {
    const onOutside = vi.fn()
    render(
      <DismissableLayer onPointerDownOutside={onOutside}>
        <div data-testid="inside">x</div>
      </DismissableLayer>,
    )
    await userEvent.pointer({
      keys: "[MouseLeft>]",
      target: screen.getByTestId("inside"),
    })
    expect(onOutside).toHaveBeenCalledTimes(0)
  })

  it("only the topmost layer responds to Escape", async () => {
    const outerEsc = vi.fn()
    const innerEsc = vi.fn()
    render(
      <DismissableLayer onEscapeKeyDown={outerEsc}>
        <DismissableLayer onEscapeKeyDown={innerEsc}>
          <div data-testid="inner">x</div>
        </DismissableLayer>
      </DismissableLayer>,
    )
    await userEvent.keyboard("{Escape}")
    expect(innerEsc).toHaveBeenCalledTimes(1)
    expect(outerEsc).toHaveBeenCalledTimes(0)
  })
})
