import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@components/radio-group"

describe("RadioGroup", () => {
  it("renders role=radiogroup with role=radio items", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    expect(screen.getByRole("radiogroup")).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(2)
  })

  it("checks the matching item from defaultValue", () => {
    render(
      <RadioGroup defaultValue="b">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole("radio")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })

  it("clicking selects an item and fires onValueChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup onValueChange={onChange}>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    await user.click(screen.getAllByRole("radio")[1] as HTMLElement)
    expect(onChange).toHaveBeenCalledWith("b")
  })

  it("supports controlled value", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState("a")
      return (
        <RadioGroup value={v} onValueChange={setV}>
          <RadioGroupItem value="a" />
          <RadioGroupItem value="b" />
        </RadioGroup>
      )
    }
    render(<Controlled />)
    const radios = screen.getAllByRole("radio")
    await user.click(radios[1] as HTMLElement)
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })

  it("disabled blocks selection", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <RadioGroup disabled onValueChange={onChange}>
        <RadioGroupItem value="a" />
      </RadioGroup>,
    )
    await user.click(screen.getByRole("radio"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("Space activates the focused radio", async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole("radio")
    ;(radios[1] as HTMLElement).focus()
    await user.keyboard(" ")
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })

  it("ArrowDown moves focus to next and selects", async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole("radio")
    ;(radios[0] as HTMLElement).focus()
    await user.keyboard("{ArrowDown}")
    expect(radios[1]).toHaveFocus()
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })

  it("Home/End jump to first/last", async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
        <RadioGroupItem value="c" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole("radio")
    ;(radios[0] as HTMLElement).focus()
    await user.keyboard("{End}")
    expect(radios[2]).toHaveFocus()
    await user.keyboard("{Home}")
    expect(radios[0]).toHaveFocus()
  })

  it("orientation=horizontal uses ArrowRight/Left", async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup orientation="horizontal">
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>,
    )
    const radios = screen.getAllByRole("radio")
    ;(radios[0] as HTMLElement).focus()
    await user.keyboard("{ArrowRight}")
    expect(radios[1]).toHaveFocus()
  })

  it("emits aria-required on the group", () => {
    render(
      <RadioGroup required>
        <RadioGroupItem value="a" />
      </RadioGroup>,
    )
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-required",
      "true",
    )
  })

  it("participates in form submission via name", async () => {
    const user = userEvent.setup()
    const captured: Array<string | null> = []
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      captured.push(fd.get("color") as string | null)
    }
    render(
      <form onSubmit={handleSubmit}>
        <RadioGroup name="color" defaultValue="red">
          <RadioGroupItem value="red" />
          <RadioGroupItem value="blue" />
        </RadioGroup>
        <button type="submit">go</button>
      </form>,
    )
    await user.click(screen.getByText("go"))
    expect(captured[0]).toBe("red")
  })
})
