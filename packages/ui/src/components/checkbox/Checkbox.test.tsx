import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { createRef, useState } from "react"
import { Checkbox } from "@components/checkbox"
import type { CheckedState } from "@components/checkbox/useCheckbox"

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox />)
    const cb = screen.getByRole("checkbox")
    expect(cb).toHaveAttribute("aria-checked", "false")
    expect(cb).toHaveAttribute("data-state", "unchecked")
  })

  it("toggles uncontrolled", async () => {
    const user = userEvent.setup()
    render(<Checkbox />)
    const cb = screen.getByRole("checkbox")
    await user.click(cb)
    expect(cb).toHaveAttribute("aria-checked", "true")
    expect(cb).toHaveAttribute("data-state", "checked")
  })

  it("supports controlled checked", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [v, setV] = useState<CheckedState>(false)
      return <Checkbox checked={v} onCheckedChange={setV} />
    }
    render(<Controlled />)
    const cb = screen.getByRole("checkbox")
    await user.click(cb)
    expect(cb).toHaveAttribute("aria-checked", "true")
  })

  it("supports indeterminate state with aria-checked=mixed", () => {
    render(<Checkbox checked="indeterminate" />)
    const cb = screen.getByRole("checkbox")
    expect(cb).toHaveAttribute("aria-checked", "mixed")
    expect(cb).toHaveAttribute("data-state", "indeterminate")
  })

  it("indeterminate -> click -> checked=true", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Checkbox defaultChecked="indeterminate" onCheckedChange={onChange} />,
    )
    await user.click(screen.getByRole("checkbox"))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox disabled onCheckedChange={onChange} />)
    await user.click(screen.getByRole("checkbox"))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("Space key toggles", async () => {
    const user = userEvent.setup()
    render(<Checkbox />)
    const cb = screen.getByRole("checkbox")
    cb.focus()
    await user.keyboard(" ")
    expect(cb).toHaveAttribute("aria-checked", "true")
  })

  it("Enter key does not submit form", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Checkbox />
      </form>,
    )
    const cb = screen.getByRole("checkbox")
    cb.focus()
    await user.keyboard("{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("forwards ref", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Checkbox ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("emits checked value on form submission when checked", async () => {
    const user = userEvent.setup()
    const captured: Array<string | null> = []
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      captured.push(fd.get("agree") as string | null)
    }
    render(
      <form onSubmit={handleSubmit}>
        <Checkbox name="agree" defaultChecked />
        <button type="submit">go</button>
      </form>,
    )
    await user.click(screen.getByText("go"))
    expect(captured[0]).toBe("on")
  })

  it("omits value on form submission when unchecked", async () => {
    const user = userEvent.setup()
    const captured: Array<string | null> = []
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      captured.push(fd.get("agree") as string | null)
    }
    render(
      <form onSubmit={handleSubmit}>
        <Checkbox name="agree" />
        <button type="submit">go</button>
      </form>,
    )
    await user.click(screen.getByText("go"))
    expect(captured[0]).toBeNull()
  })
})
