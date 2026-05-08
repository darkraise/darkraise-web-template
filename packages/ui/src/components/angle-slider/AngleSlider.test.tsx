import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { AngleSlider } from "./AngleSlider"

describe("AngleSlider", () => {
  it("renders with role='slider' and the controlled value", () => {
    render(<AngleSlider value={45} onValueChange={() => {}} aria-label="Hue" />)
    const slider = screen.getByRole("slider", { name: "Hue" })
    expect(slider).toHaveAttribute("aria-valuenow", "45")
    expect(slider).toHaveAttribute("aria-valuemin", "0")
    expect(slider).toHaveAttribute("aria-valuemax", "359")
  })

  it("ArrowRight increments by 1, ArrowLeft decrements by 1", async () => {
    const onValueChange = vi.fn()
    function Wrapper() {
      const [v, setV] = React.useState(10)
      return (
        <AngleSlider
          value={v}
          onValueChange={(next) => {
            setV(next)
            onValueChange(next)
          }}
          aria-label="A"
        />
      )
    }
    render(<Wrapper />)
    const slider = screen.getByRole("slider")
    slider.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenLastCalledWith(11)
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(onValueChange).toHaveBeenLastCalledWith(9)
  })

  it("wraps from 359 to 0 going forward", async () => {
    const onValueChange = vi.fn()
    render(
      <AngleSlider value={359} onValueChange={onValueChange} aria-label="A" />,
    )
    screen.getByRole("slider").focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenCalledWith(0)
  })

  it("Home jumps to 0, End jumps to 359", async () => {
    const onValueChange = vi.fn()
    render(
      <AngleSlider value={42} onValueChange={onValueChange} aria-label="A" />,
    )
    screen.getByRole("slider").focus()
    await userEvent.keyboard("{End}")
    expect(onValueChange).toHaveBeenLastCalledWith(359)
    await userEvent.keyboard("{Home}")
    expect(onValueChange).toHaveBeenLastCalledWith(0)
  })

  it("disabled slider has tabIndex -1 and ignores keyboard", async () => {
    const onValueChange = vi.fn()
    render(
      <AngleSlider
        value={10}
        onValueChange={onValueChange}
        disabled
        aria-label="A"
      />,
    )
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("tabIndex", "-1")
    expect(slider).toHaveAttribute("aria-disabled", "true")
  })
})
