import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { createRef, useState } from "react"
import { Switch } from "@components/switch"

describe("Switch", () => {
  it("renders a button with role=switch and unchecked by default", () => {
    render(<Switch />)
    const sw = screen.getByRole("switch")
    expect(sw).toBeInTheDocument()
    expect(sw).toHaveAttribute("aria-checked", "false")
    expect(sw).toHaveAttribute("data-state", "unchecked")
  })

  it("toggles on click in uncontrolled mode", async () => {
    const user = userEvent.setup()
    render(<Switch />)
    const sw = screen.getByRole("switch")
    await user.click(sw)
    expect(sw).toHaveAttribute("aria-checked", "true")
    expect(sw).toHaveAttribute("data-state", "checked")
  })

  it("respects defaultChecked", () => {
    render(<Switch defaultChecked />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
  })

  it("calls onCheckedChange with the new value", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch onCheckedChange={onCheckedChange} />)
    await user.click(screen.getByRole("switch"))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("respects controlled checked prop", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState(false)
      return <Switch checked={v} onCheckedChange={setV} />
    }
    render(<Controlled />)
    const sw = screen.getByRole("switch")
    expect(sw).toHaveAttribute("aria-checked", "false")
    await user.click(sw)
    expect(sw).toHaveAttribute("aria-checked", "true")
  })

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch disabled onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole("switch")
    expect(sw).toHaveAttribute("data-disabled", "")
    await user.click(sw)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it("toggles on Space key", async () => {
    const user = userEvent.setup()
    render(<Switch />)
    const sw = screen.getByRole("switch")
    sw.focus()
    await user.keyboard(" ")
    expect(sw).toHaveAttribute("aria-checked", "true")
  })

  it("toggles on Enter key", async () => {
    const user = userEvent.setup()
    render(<Switch />)
    const sw = screen.getByRole("switch")
    sw.focus()
    await user.keyboard("{Enter}")
    expect(sw).toHaveAttribute("aria-checked", "true")
  })

  it("forwards ref", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Switch ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("participates in form submission with name and value", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      onSubmit.mock.calls[onSubmit.mock.calls.length - 1].push(fd.get("notify"))
    })
    render(
      <form onSubmit={onSubmit}>
        <Switch name="notify" value="yes" defaultChecked />
        <button type="submit">go</button>
      </form>,
    )
    await user.click(screen.getByText("go"))
    const lastCall = onSubmit.mock.calls[onSubmit.mock.calls.length - 1]
    expect(lastCall?.[1]).toBe("yes")
  })

  it("omits form value when unchecked", async () => {
    const user = userEvent.setup()
    const captured: Array<string | null> = []
    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      captured.push(fd.get("notify") as string | null)
    }
    render(
      <form onSubmit={onSubmit}>
        <Switch name="notify" value="yes" />
        <button type="submit">go</button>
      </form>,
    )
    await user.click(screen.getByText("go"))
    expect(captured[0]).toBeNull()
  })
})
