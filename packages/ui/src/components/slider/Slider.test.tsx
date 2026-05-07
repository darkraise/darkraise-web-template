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
})
