import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { Slider } from "@components/slider"

describe("Slider", () => {
  it("renders one thumb with role=slider and ARIA values", () => {
    render(<Slider defaultValue={[40]} min={0} max={100} />)
    const thumb = screen.getByRole("slider")
    expect(thumb).toHaveAttribute("aria-valuemin", "0")
    expect(thumb).toHaveAttribute("aria-valuemax", "100")
    expect(thumb).toHaveAttribute("aria-valuenow", "40")
    expect(thumb).toHaveAttribute("aria-orientation", "horizontal")
  })

  it("renders multiple thumbs in range mode", () => {
    render(<Slider defaultValue={[20, 80]} />)
    const thumbs = screen.getAllByRole("slider")
    expect(thumbs).toHaveLength(2)
  })

  it("ArrowRight increments by step", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider defaultValue={[50]} step={5} onValueChange={onChange} />)
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{ArrowRight}")
    expect(onChange).toHaveBeenLastCalledWith([55])
  })

  it("Shift+ArrowRight increments by 10x step", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider defaultValue={[50]} step={1} onValueChange={onChange} />)
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}")
    expect(onChange).toHaveBeenLastCalledWith([60])
  })

  it("Home/End jump to min/max", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Slider defaultValue={[50]} min={0} max={100} onValueChange={onChange} />,
    )
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{Home}")
    expect(onChange).toHaveBeenLastCalledWith([0])
    await user.keyboard("{End}")
    expect(onChange).toHaveBeenLastCalledWith([100])
  })

  it("PageUp/PageDown adjust by step*10", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider defaultValue={[50]} step={1} onValueChange={onChange} />)
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{PageUp}")
    expect(onChange).toHaveBeenLastCalledWith([60])
    await user.keyboard("{PageDown}")
    expect(onChange).toHaveBeenLastCalledWith([50])
  })

  it("clamps within min/max", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Slider
        defaultValue={[100]}
        min={0}
        max={100}
        onValueChange={onChange}
      />,
    )
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{ArrowRight}")
    expect(thumb).toHaveAttribute("aria-valuenow", "100")
  })

  it("supports controlled value", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState([10])
      return <Slider value={v} onValueChange={setV} />
    }
    render(<Controlled />)
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{ArrowRight}")
    expect(thumb).toHaveAttribute("aria-valuenow", "11")
  })

  it("does not move when disabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Slider defaultValue={[50]} disabled onValueChange={onChange} />)
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{ArrowRight}")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("vertical orientation uses ArrowUp to increment", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Slider
        defaultValue={[50]}
        orientation="vertical"
        step={1}
        onValueChange={onChange}
      />,
    )
    const thumb = screen.getByRole("slider")
    thumb.focus()
    await user.keyboard("{ArrowUp}")
    expect(onChange).toHaveBeenLastCalledWith([51])
  })

  describe("showSteps", () => {
    it("renders no anchor dots by default", () => {
      const { container } = render(
        <Slider defaultValue={[1]} min={0} max={3} step={1} />,
      )
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(0)
    })

    it("renders inner anchor dots only (excluding first and last stops)", () => {
      const { container } = render(
        <Slider defaultValue={[1]} min={0} max={3} step={1} showSteps />,
      )
      // 4 stops total (0, 1, 2, 3) → 2 inner dots (1, 2). First and
      // last are already implied by the track edges.
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(2)
    })

    it("renders inner dots up to the cap (20 stops total → 18 dots)", () => {
      const { container } = render(
        <Slider defaultValue={[0]} min={0} max={19} step={1} showSteps />,
      )
      // 20 stops total — under the cap. 18 inner dots (excludes ends).
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(18)
    })

    it("renders no dots when stop count exceeds the cap even with showSteps", () => {
      const { container } = render(
        <Slider defaultValue={[50]} min={0} max={100} step={1} showSteps />,
      )
      // 101 stops > MAX_VISIBLE_STEPS (20) — silently suppressed.
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(0)
    })

    it("renders no dots for invalid step", () => {
      const { container } = render(
        <Slider defaultValue={[50]} min={0} max={100} step={0} showSteps />,
      )
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(0)
    })

    it("renders no dots when there are fewer than 3 stops (no inner stops to mark)", () => {
      const { container } = render(
        <Slider defaultValue={[0]} min={0} max={1} step={1} showSteps />,
      )
      // 2 stops (0, 1) — both are endpoints; no inner stops exist.
      expect(container.querySelectorAll(".dr-slider-step")).toHaveLength(0)
    })
  })
})
