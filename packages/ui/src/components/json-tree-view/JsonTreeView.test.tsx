import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JsonTreeView } from "./JsonTreeView"

describe("JsonTreeView", () => {
  it("renders a primitive value with its type class", () => {
    render(<JsonTreeView data={"hello"} />)
    expect(screen.getByText("hello")).toBeInTheDocument()
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

  it("copyable adds Copy path and Copy value actions on every row", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    render(<JsonTreeView data={{ x: 1 }} copyable defaultExpandLevel={1} />)
    // The root row has both buttons; the leaf row also has both.
    const valueButtons = screen.getAllByRole("button", { name: "Copy value" })
    const pathButtons = screen.getAllByRole("button", { name: "Copy path" })
    expect(valueButtons.length).toBeGreaterThanOrEqual(2)
    expect(pathButtons.length).toBeGreaterThanOrEqual(2)
    // Click the root's Copy value — should emit the full object stringified.
    const first = valueButtons[0]
    if (!first) throw new Error("expected at least one Copy value button")
    await userEvent.click(first)
    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ x: 1 }, null, 2))
  })

  it("Copy path emits a JSONPath-style string", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    render(
      <JsonTreeView
        data={{ users: [{ name: "Jane" }] }}
        copyable
        defaultExpandLevel={5}
      />,
    )
    // Find the row for `name` and click its Copy path button.
    const pathButtons = screen.getAllByRole("button", { name: "Copy path" })
    // The order should be: root, users, users[0], users[0].name.
    // Click the last one (the leaf).
    const last = pathButtons[pathButtons.length - 1]
    if (!last) throw new Error("expected at least one Copy path button")
    await userEvent.click(last)
    expect(writeText).toHaveBeenCalledWith("$.users[0].name")
  })

  it("empty containers render inline without children", () => {
    render(<JsonTreeView data={{ tags: [], meta: {} }} />)
    expect(screen.getByText("[]")).toBeInTheDocument()
    expect(screen.getByText("{}")).toBeInTheDocument()
  })

  it("toolbar search filters the tree to matching paths", async () => {
    render(
      <JsonTreeView
        data={{ alpha: 1, beta: 2, gamma: { delta: 3 } }}
        toolbar
        defaultExpandLevel={1}
      />,
    )
    const search = screen.getByPlaceholderText(/search/i)
    await userEvent.type(search, "delta")
    // gamma is an ancestor of the match → still visible
    expect(screen.getByText("gamma")).toBeInTheDocument()
    expect(screen.getByText("delta")).toBeInTheDocument()
    // alpha and beta have no descendants matching → hidden
    expect(screen.queryByText("alpha")).not.toBeInTheDocument()
    expect(screen.queryByText("beta")).not.toBeInTheDocument()
  })

  it("expand all and collapse all toolbar buttons work", async () => {
    render(
      <JsonTreeView
        data={{ a: { b: { c: 1 } } }}
        toolbar
        defaultExpandLevel={0}
      />,
    )
    // Initially nothing is expanded — only `a` is visible at the root.
    expect(screen.queryByText("b")).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /expand all/i }))
    expect(screen.getByText("c")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /collapse all/i }))
    expect(screen.queryByText("c")).not.toBeInTheDocument()
  })

  it("renders a URL as a clickable link", () => {
    render(<JsonTreeView data={{ home: "https://example.com" }} />)
    const link = screen.getByRole("link", { name: /example\.com/i })
    expect(link).toHaveAttribute("href", "https://example.com")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("renders a color swatch for a hex value", () => {
    const { container } = render(<JsonTreeView data={{ brand: "#3b82f6" }} />)
    const swatch = container.querySelector(
      ".dr-json-color-swatch",
    ) as HTMLElement | null
    expect(swatch).not.toBeNull()
    if (!swatch) return
    expect(swatch.style.background).toMatch(/3b82f6|rgb/)
  })
})
