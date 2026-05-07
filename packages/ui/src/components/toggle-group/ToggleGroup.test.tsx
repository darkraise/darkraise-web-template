import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"

describe("ToggleGroup", () => {
  it("renders a group with role=group", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    expect(screen.getByRole("group")).toBeInTheDocument()
  })

  it("single: items have role=radio + aria-checked", () => {
    render(
      <ToggleGroup type="single" defaultValue="b">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const radios = screen.getAllByRole("radio")
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })

  it("multiple: items have aria-pressed", () => {
    render(
      <ToggleGroup type="multiple" defaultValue={["a"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true")
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false")
  })

  it("single: clicking selects item, clicking again deselects", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ToggleGroup type="single" onValueChange={onChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    await user.click(a)
    expect(onChange).toHaveBeenLastCalledWith("a")
    await user.click(a)
    expect(onChange).toHaveBeenLastCalledWith("")
  })

  it("multiple: toggles into and out of the array", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState<string[]>([])
      return (
        <>
          <span data-testid="v">{v.join(",")}</span>
          <ToggleGroup type="multiple" value={v} onValueChange={setV}>
            <ToggleGroupItem value="a">A</ToggleGroupItem>
            <ToggleGroupItem value="b">B</ToggleGroupItem>
          </ToggleGroup>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByText("A"))
    expect(screen.getByTestId("v").textContent).toBe("a")
    await user.click(screen.getByText("B"))
    expect(screen.getByTestId("v").textContent).toBe("a,b")
    await user.click(screen.getByText("A"))
    expect(screen.getByTestId("v").textContent).toBe("b")
  })

  it("ArrowRight focuses next item", async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    a.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("B")).toHaveFocus()
  })

  it("ArrowLeft loops to last with default loop", async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    a.focus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByText("B")).toHaveFocus()
  })

  it("Home/End jump to first/last", async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    a.focus()
    await user.keyboard("{End}")
    expect(screen.getByText("C")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(screen.getByText("A")).toHaveFocus()
  })

  it("disabled items skipped in keyboard nav", async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          B
        </ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    a.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("C")).toHaveFocus()
  })

  it("orientation=vertical uses ArrowDown/Up", async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single" orientation="vertical">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByText("A")
    a.focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByText("B")).toHaveFocus()
  })

  it("variant + size data attrs propagate", () => {
    render(
      <ToggleGroup type="single" variant="outline" size="lg">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )
    const btn = screen.getByText("A")
    expect(btn).toHaveAttribute("data-variant", "outline")
    expect(btn).toHaveAttribute("data-size", "lg")
  })
})
