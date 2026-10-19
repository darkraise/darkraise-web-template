import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"

describe("ToggleGroup", () => {
  it("single: renders role=radiogroup so the radio items have an owning set", () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    expect(screen.getByRole("radiogroup")).toBeInTheDocument()
  })

  it("multiple: renders role=group", () => {
    render(
      <ToggleGroup type="multiple">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    expect(screen.getByRole("group")).toBeInTheDocument()
  })

  it("accepts a consumer role and an accessible name", () => {
    render(
      <ToggleGroup type="single" role="toolbar" aria-label="Text alignment">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )
    expect(
      screen.getByRole("toolbar", { name: "Text alignment" }),
    ).toBeInTheDocument()
  })

  it("carries a roving tabindex: one stop for the whole group", () => {
    render(
      <ToggleGroup type="single" defaultValue="b">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    )
    const radios = screen.getAllByRole("radio")
    expect(radios.map((r) => r.getAttribute("tabindex"))).toEqual([
      "-1",
      "0",
      "-1",
    ])
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

  it("single: activating the checked item keeps it checked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ToggleGroup type="single" onValueChange={onChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )
    const a = screen.getByRole("radio", { name: "A" })
    await user.click(a)
    expect(onChange).toHaveBeenCalledExactlyOnceWith("a")
    await user.click(a)
    await user.keyboard(" ")
    await user.keyboard("{Enter}")
    expect(onChange).toHaveBeenCalledOnce()
    expect(a).toHaveAttribute("aria-checked", "true")
  })

  it("single: arrows, Home and End move focus and check the item", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ToggleGroup type="single" defaultValue="a" onValueChange={onChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          B
        </ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
        <ToggleGroupItem value="d">D</ToggleGroupItem>
      </ToggleGroup>,
    )
    const checked = () =>
      screen.getByRole("radio", { checked: true }).textContent
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "C" })).toHaveFocus()
    expect(checked()).toBe("C")
    await user.keyboard("{End}")
    expect(screen.getByRole("radio", { name: "D" })).toHaveFocus()
    expect(checked()).toBe("D")
    await user.keyboard("{Home}")
    expect(screen.getByRole("radio", { name: "A" })).toHaveFocus()
    expect(checked()).toBe("A")
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("radio", { name: "D" })).toHaveFocus()
    expect(checked()).toBe("D")
    expect(onChange.mock.calls).toEqual([["c"], ["d"], ["a"], ["d"]])
  })

  it("single: a controlled group follows arrow selection", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState("a")
      return (
        <>
          <span data-testid="v">{v}</span>
          <ToggleGroup type="single" value={v} onValueChange={setV}>
            <ToggleGroupItem value="a">A</ToggleGroupItem>
            <ToggleGroupItem value="b">B</ToggleGroupItem>
          </ToggleGroup>
        </>
      )
    }
    render(<Controlled />)
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByTestId("v").textContent).toBe("b")
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "tabindex",
      "0",
    )
  })

  it("multiple: arrows move focus without pressing", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ToggleGroup type="multiple" onValueChange={onChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
        <ToggleGroupItem value="c">C</ToggleGroupItem>
      </ToggleGroup>,
    )
    await user.tab()
    await user.keyboard("{ArrowRight}{End}{Home}")
    expect(screen.getByRole("button", { name: "A" })).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-pressed", "false")
    }
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

  it("ArrowLeft focuses the next item under RTL", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>,
    )
    screen.getByText("A").focus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByText("B")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("A")).toHaveFocus()
  })

  it("keeps ArrowDown and ArrowUp on a vertical group under RTL", async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <ToggleGroup type="single" orientation="vertical">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      </div>,
    )
    screen.getByText("A").focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByText("B")).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(screen.getByText("A")).toHaveFocus()
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
