import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@data-table"

interface Row {
  name: string
  total: number
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "total", header: "Total", meta: { align: "end" } },
]

describe("DataTable meta.align", () => {
  it("aligns a column's header and every cell from meta.align", () => {
    render(
      <DataTable
        columns={columns}
        data={[
          { name: "A", total: 5 },
          { name: "B", total: 12 },
        ]}
      />,
    )
    expect(screen.getByRole("columnheader", { name: "Total" })).toHaveAttribute(
      "data-align",
      "end",
    )
    for (const value of ["5", "12"]) {
      expect(screen.getByRole("cell", { name: value })).toHaveAttribute(
        "data-align",
        "end",
      )
    }
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).not.toHaveAttribute("data-align")
    expect(screen.getByRole("cell", { name: "A" })).not.toHaveAttribute(
      "data-align",
    )
  })
})
