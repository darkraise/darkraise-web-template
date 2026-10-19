import { readFileSync } from "node:fs"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ColumnDef } from "@tanstack/react-table"
import { describe, it, expect } from "vitest"
import { DataTable } from "@data-table"
import { parseRules } from "@styles/interactive-classes"

interface Row {
  createdAt: string
  status: string
  kind: string
}

const rows: Row[] = [
  { createdAt: "2026-01-01", status: "active", kind: "alpha" },
  { createdAt: "2026-01-02", status: "inactive", kind: "beta" },
]

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "createdAt",
    header: () => <span>Created on</span>,
    meta: { label: "Created on" },
  },
  {
    accessorKey: "status",
    header: () => <span>Status</span>,
  },
  { accessorKey: "kind", header: "Kind of thing" },
]

async function openColumns(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Columns" }))
}

describe("DataTable column labels", () => {
  it("names column visibility items by label, string header, then id", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} />)
    await openColumns(user)
    const items = screen.getAllByRole("menuitemcheckbox")
    expect(items.map((item) => item.textContent)).toEqual([
      "Created on",
      "status",
      "Kind of thing",
    ])
  })

  it("leaves the case of column visibility items alone", async () => {
    const user = userEvent.setup()
    render(<DataTable columns={columns} data={rows} />)
    await openColumns(user)
    for (const item of screen.getAllByRole("menuitemcheckbox")) {
      expect(item).not.toHaveClass("capitalize")
    }
  })

  it("names a facet filter by the column label", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        facets={["createdAt", "status", "kind"]}
      />,
    )
    expect(
      screen.getByRole("button", { name: "Filter by Created on" }),
    ).toHaveTextContent("Created on")
    expect(
      screen.getByRole("button", { name: "Filter by status" }),
    ).toHaveTextContent("status")
    expect(
      screen.getByRole("button", { name: "Filter by Kind of thing" }),
    ).toHaveTextContent("Kind of thing")
  })

  it("leaves the case of facet values alone", () => {
    const css = readFileSync("src/data-table/data-table.css", "utf8")
    const rules = parseRules(css).filter((rule) =>
      rule.selectors.includes(".dr-data-table-facet-value"),
    )
    expect(rules).not.toHaveLength(0)
    for (const rule of rules) expect(rule.body).not.toContain("capitalize")
  })
})
