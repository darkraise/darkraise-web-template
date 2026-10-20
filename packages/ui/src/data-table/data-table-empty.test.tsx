import { readFileSync } from "node:fs"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { DataTable } from "@data-table"
import { parseRules } from "@styles/interactive-classes"

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "kind", header: "Kind" },
  { accessorKey: "size", header: "Size" },
]

function emptyCell(): HTMLTableCellElement {
  const cell = screen.getByText("No results found").closest("td")
  if (!cell) throw new Error("the empty state is not inside a cell")
  return cell
}

function body(selector: string): string {
  const css = readFileSync("src/data-table/data-table.css", "utf8")
  const bodies = parseRules(css)
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
  if (bodies.length === 0) throw new Error(`no rule ${selector}`)
  return bodies.join(" ")
}

describe("DataTable empty state", () => {
  it("spans every column when none is hidden", () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(emptyCell().colSpan).toBe(3)
  })

  it("spans only the visible columns after one is hidden", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={[]} />)
    await user.click(screen.getByRole("button", { name: "Columns" }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Kind" }))
    expect(screen.getAllByRole("columnheader")).toHaveLength(2)
    expect(emptyCell().colSpan).toBe(2)
  })

  it("loads with a skeleton cell per visible column", async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(
      <DataTable columns={columns} data={[]} />,
    )
    await user.click(screen.getByRole("button", { name: "Columns" }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Kind" }))
    rerender(<DataTable columns={columns} data={[]} isLoading />)
    const header = container.querySelector(".dr-data-table-skeleton-row-cells")
    expect(header?.children).toHaveLength(2)
  })

  it("keeps its message in the visible part of a scrolled table", () => {
    expect(
      body(
        ".dr-data-table-frame:has(.dr-data-table-empty-cell) .dr-table-wrapper",
      ),
    ).toContain("container-type: inline-size;")
    const content = body(".dr-data-table-empty-cell > .dr-data-table-empty")
    expect(content).toContain("position: sticky;")
    expect(content).toContain("inset-inline-start: 0;")
    expect(content).toContain("inline-size: 100cqi;")
    expect(body(".dr-data-table-empty-cell")).toContain("padding: 0;")
  })

  it("lets a table with rows size to its content", () => {
    expect(() => body(".dr-data-table-frame .dr-table-wrapper")).toThrow()
  })

  it("sizes the rows-per-page trigger to its value", () => {
    const trigger = body(".dr-data-table-pagination-page-size-trigger")
    expect(trigger).toContain("inline-size: auto;")
    expect(trigger).toContain("min-inline-size: 70px;")
    expect(trigger).not.toContain("w-[70px]")
  })
})
