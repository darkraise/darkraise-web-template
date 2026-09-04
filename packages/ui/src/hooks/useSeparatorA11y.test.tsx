import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { useSeparatorA11y } from "./useSeparatorA11y"
import type { SeparatorA11yOptions } from "./useSeparatorA11y"

function Handle(options: Partial<SeparatorA11yOptions> = {}) {
  const props = useSeparatorA11y({
    orientation: "horizontal",
    valueNow: 30,
    onNudge: () => {},
    ...options,
  })
  return <div {...props} />
}

describe("useSeparatorA11y", () => {
  it("reports the perpendicular axis, matching the ARIA separator model", () => {
    render(<Handle />)
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    )
  })

  it("reports the vertical group's separator as horizontal", () => {
    render(<Handle orientation="vertical" />)
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    )
  })

  it("nudges by the step on the in-axis arrows", () => {
    const onNudge = vi.fn()
    render(<Handle onNudge={onNudge} />)
    const handle = screen.getByRole("separator")

    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(onNudge).toHaveBeenCalledWith(5)

    fireEvent.keyDown(handle, { key: "ArrowLeft" })
    expect(onNudge).toHaveBeenCalledWith(-5)
  })

  it("ignores the cross-axis arrows", () => {
    const onNudge = vi.fn()
    render(<Handle onNudge={onNudge} />)
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowUp" })
    expect(onNudge).not.toHaveBeenCalled()
  })

  it("jumps to the edges on Home and End", () => {
    const onJump = vi.fn()
    render(<Handle onJump={onJump} />)
    const handle = screen.getByRole("separator")

    fireEvent.keyDown(handle, { key: "Home" })
    expect(onJump).toHaveBeenCalledWith("min")

    fireEvent.keyDown(handle, { key: "End" })
    expect(onJump).toHaveBeenCalledWith("max")
  })

  it("leaves Home and End alone when no jump handler is given", () => {
    // Resizable has never bound these; extracting the hook must not add them.
    const onNudge = vi.fn()
    render(<Handle onNudge={onNudge} />)
    fireEvent.keyDown(screen.getByRole("separator"), { key: "Home" })
    expect(onNudge).not.toHaveBeenCalled()
  })

  it("is not focusable and does not respond when disabled", () => {
    const onNudge = vi.fn()
    render(<Handle disabled onNudge={onNudge} />)
    const handle = screen.getByRole("separator")

    expect(handle).toHaveAttribute("tabindex", "-1")
    fireEvent.keyDown(handle, { key: "ArrowRight" })
    expect(onNudge).not.toHaveBeenCalled()
  })
})
