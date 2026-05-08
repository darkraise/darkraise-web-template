import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JsonTreeView } from "./JsonTreeView"

describe("JsonTreeView", () => {
  it("renders a primitive value with its type class", () => {
    render(<JsonTreeView data={"hello"} />)
    expect(screen.getByText('"hello"')).toBeInTheDocument()
  })

  it("renders a top-level object with its keys", () => {
    render(<JsonTreeView data={{ name: "Jane", age: 30 }} />)
    expect(screen.getByText("name")).toBeInTheDocument()
    expect(screen.getByText("age")).toBeInTheDocument()
  })

  it("toggles a collapsed branch on click", async () => {
    render(
      <JsonTreeView data={{ inner: { deep: 1 } }} defaultExpandLevel={1} />,
    )
    expect(screen.queryByText("deep")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /toggle inner/i }))
    expect(screen.getByText("deep")).toBeInTheDocument()
  })

  it("defaultExpandLevel respected", () => {
    render(
      <JsonTreeView data={{ a: { b: { c: 1 } } }} defaultExpandLevel={2} />,
    )
    expect(screen.getByText("a")).toBeInTheDocument()
    expect(screen.getByText("b")).toBeInTheDocument()
    // c key is at depth 3; expanded only to level 2 → not shown
    expect(screen.queryByText("c")).not.toBeInTheDocument()
  })

  it("array shows length summary", () => {
    render(<JsonTreeView data={{ items: [1, 2, 3] }} />)
    expect(screen.getByText("Array(3)")).toBeInTheDocument()
  })

  it("copy button writes JSON to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    render(<JsonTreeView data={{ x: 1 }} copyable defaultExpandLevel={1} />)
    await userEvent.click(screen.getByRole("button", { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ x: 1 }, null, 2))
  })
})
